# app.py
from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import os
from threading import Thread, Event
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# === Config ===
file_path = os.path.join(os.path.dirname(__file__), "ML_DATASET.csv")
CACHE_REFRESH_SECONDS = 10 * 60  # 10 minutes
WARMUP_DELAY_SECONDS = 1  # small delay before first preload

# === In-memory cache for precomputed responses ===
cache = {
    "renewals": None,
    "new_business": None,
    "total_forecast": None,
    "comparison": None,
    "last_updated": None,
}

stop_event = Event()


# === Helpers for regression & safety ===
def safe_int_series(s):
    """Try to coerce a series to int, ignoring bad rows."""
    return pd.to_numeric(s, errors="coerce").astype("Int64")


def linear_forecast(df, target_col, year_range):
    """Simple linear regression forecast on the provided dataframe.
       Requires df to have 'registrationYear' and target_col numeric columns.
       Returns list of dicts: [{ 'registrationYear': 2026, target_col: value }, ...]
    """
    # Ensure correct columns exist
    if df is None or df.empty or target_col not in df.columns:
        # Return zero predictions if insufficient data
        return [{"registrationYear": int(y), target_col: 0.0} for y in year_range]

    # Drop NaNs for target and year
    tmp = df[['registrationYear', target_col]].dropna()

    # Must have at least 2 distinct years to fit a linear model
    if tmp['registrationYear'].nunique() < 2 or tmp.shape[0] < 2:
        # fallback: repeat last known value or zero
        last_val = float(tmp[target_col].iloc[-1]) if not tmp.empty else 0.0
        return [{"registrationYear": int(y), target_col: float(last_val)} for y in year_range]

    X = tmp[['registrationYear']].astype(float)
    y = tmp[target_col].astype(float)

    try:
        model = LinearRegression()
        model.fit(X, y)
        preds = []
        for year in year_range:
            pred = model.predict([[float(year)]])[0]
            # Ensure non-negative and finite
            if np.isfinite(pred):
                pred_val = float(max(pred, 0.0))
            else:
                pred_val = 0.0
            preds.append({"registrationYear": int(year), target_col: pred_val})
        return preds
    except Exception as e:
        # On any failure return zeros / last known
        last_val = float(y.iloc[-1]) if not y.empty else 0.0
        return [{"registrationYear": int(y), target_col: float(last_val)} for y in year_range]


# === Core computation functions ===
def compute_renewals_summary(df):
    """Return dataframe with registrationYear, Renewals, TotalBusinesses, NonRenewals"""
    dd = df[['registrationYear', 'willRenew']].dropna()
    # Map Yes/No to 1/0
    dd['willRenew'] = dd['willRenew'].astype(str).map({'Yes': 1, 'No': 0, '1': 1, '0': 0})
    dd['registrationYear'] = safe_int_series(dd['registrationYear'])
    dd = dd.dropna(subset=['registrationYear'])
    dd['registrationYear'] = dd['registrationYear'].astype(int)

    # filter years to a sensible range if needed; we keep all years present
    if dd.empty:
        return pd.DataFrame(columns=['registrationYear', 'Renewals', 'TotalBusinesses', 'NonRenewals'])

    renewals_per_year = dd.groupby('registrationYear')['willRenew'].sum().reset_index(name='Renewals')
    total_per_year = dd.groupby('registrationYear')['willRenew'].count().reset_index(name='TotalBusinesses')
    summary = pd.merge(renewals_per_year, total_per_year, on='registrationYear')
    summary['NonRenewals'] = summary['TotalBusinesses'] - summary['Renewals']
    summary = summary.sort_values('registrationYear').reset_index(drop=True)
    return summary


def compute_new_business_summary(df):
    """Return dataframe with registrationYear, NewBusiness"""
    dd = df[['registrationYear', 'businessType']].dropna()
    dd['registrationYear'] = safe_int_series(dd['registrationYear'])
    dd = dd.dropna(subset=['registrationYear'])
    dd['registrationYear'] = dd['registrationYear'].astype(int)

    if dd.empty:
        return pd.DataFrame(columns=['registrationYear', 'NewBusiness'])

    new_business = dd.groupby('registrationYear')['businessType'].count().reset_index(name='NewBusiness')
    new_business = new_business.sort_values('registrationYear').reset_index(drop=True)
    return new_business


def compute_total_forecast_df(renewals_df, new_business_df):
    """Merge renewals & new business and compute TotalForecast column"""
    if renewals_df.empty or new_business_df.empty:
        # Try to merge whatever is available
        merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)
    else:
        merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)

    merged['Renewals'] = merged.get('Renewals', pd.Series(0))
    merged['NewBusiness'] = merged.get('NewBusiness', pd.Series(0))
    merged['TotalForecast'] = merged['Renewals'].astype(float) + merged['NewBusiness'].astype(float)
    merged = merged[['registrationYear', 'Renewals', 'NewBusiness', 'TotalForecast']].sort_values('registrationYear').reset_index(drop=True)
    return merged


def compute_comparison_df(renewals_df, new_business_df):
    """Produce a comparison DataFrame: registrationYear, Renewals, NewBusiness"""
    if renewals_df.empty or new_business_df.empty:
        merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)
    else:
        merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)

    merged = merged[['registrationYear', 'Renewals', 'NewBusiness']].sort_values('registrationYear').reset_index(drop=True)
    return merged


# === Full compute & cache update ===
def compute_all_predictions():
    """Read CSV, compute summaries and predictions, store them into cache dict."""
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
    except FileNotFoundError:
        print(f"ML_DATASET.csv not found at {file_path}")
        return
    except Exception as e:
        print("Error reading dataset:", e)
        return

    # Ensure columns exist
    if 'registrationYear' not in df.columns:
        print("CSV missing 'registrationYear' column")
        return

    # Compute base summaries
    renewals_summary = compute_renewals_summary(df)
    new_business_summary = compute_new_business_summary(df)

    # Compute totals summary
    total_df = compute_total_forecast_df(renewals_summary, new_business_summary)

    # Compute comparison
    comparison_df = compute_comparison_df(renewals_summary, new_business_summary)

    # Forecast year(s)
    forecast_years = [2026]

    # Compute predictions using linear regression helper
    try:
        renew_preds = linear_forecast(renewals_summary, 'Renewals', forecast_years)
    except Exception:
        renew_preds = [{"registrationYear": 2026, "Renewals": 0.0}]

    try:
        total_preds = linear_forecast(total_df, 'TotalForecast', forecast_years)
    except Exception:
        total_preds = [{"registrationYear": 2026, "TotalForecast": 0.0}]

    try:
        new_preds = linear_forecast(new_business_summary, 'NewBusiness', forecast_years)
    except Exception:
        new_preds = [{"registrationYear": 2026, "NewBusiness": 0.0}]

    # Attach predictions to the respective dataframes (append one row for 2026)
    try:
        renewals_with_pred = pd.concat([renewals_summary, pd.DataFrame(renew_preds)], ignore_index=True)
    except Exception:
        renewals_with_pred = renewals_summary.copy()

    try:
        new_business_with_pred = pd.concat([new_business_summary, pd.DataFrame(new_preds)], ignore_index=True)
    except Exception:
        new_business_with_pred = new_business_summary.copy()

    try:
        total_with_pred = pd.concat([total_df, pd.DataFrame(total_preds)], ignore_index=True)
    except Exception:
        total_with_pred = total_df.copy()

    try:
        # For comparison, merge renew_preds and new_preds by year
        merged_preds = pd.merge(pd.DataFrame(renew_preds), pd.DataFrame(new_preds), on='registrationYear', how='outer')
        comparison_with_pred = pd.concat([comparison_df, merged_preds], ignore_index=True)
    except Exception:
        comparison_with_pred = comparison_df.copy()

    # Replace any inf/nan with 0
    renewals_with_pred = renewals_with_pred.replace([np.nan, np.inf, -np.inf], 0)
    new_business_with_pred = new_business_with_pred.replace([np.nan, np.inf, -np.inf], 0)
    total_with_pred = total_with_pred.replace([np.nan, np.inf, -np.inf], 0)
    comparison_with_pred = comparison_with_pred.replace([np.nan, np.inf, -np.inf], 0)

    # Convert to standard python types (JSON serializable)
    cache['renewals'] = {"message": "✅ Renewal prediction successful (cached)",
                         "data": renewals_with_pred.to_dict(orient='records')}
    cache['new_business'] = {"message": "✅ New Business prediction successful (cached)",
                             "data": new_business_with_pred.to_dict(orient='records')}
    cache['total_forecast'] = {"message": "✅ Total forecast successful (cached)",
                               "data": total_with_pred.to_dict(orient='records')}
    cache['comparison'] = {"message": "✅ Comparison prediction successful (cached)",
                           "data": comparison_with_pred.to_dict(orient='records')}
    cache['last_updated'] = datetime.utcnow().isoformat()
    print(f"[{datetime.utcnow().isoformat()}] Cached predictions updated.")


# === Background refresher thread ===
def cache_refresher():
    # small initial delay to let server start
    time.sleep(WARMUP_DELAY_SECONDS)
    while not stop_event.is_set():
        try:
            compute_all_predictions()
        except Exception as e:
            print("Error during cache refresh:", e)
        # Sleep then repeat
        for _ in range(int(CACHE_REFRESH_SECONDS)):
            if stop_event.is_set():
                break
            time.sleep(1)


# === Flask routes ===
@app.route('/')
def home():
    return jsonify({"message": "✅ Flask ML API running fine!", "cached_at": cache.get('last_updated')})


# Original endpoints (on-demand computation)
@app.route('/predict-renewals', methods=['GET'])
def predict_renewals():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        summary = compute_renewals_summary(df)
        # forecast 2026
        renew_preds = linear_forecast(summary, 'Renewals', [2026])
        total_preds = linear_forecast(summary, 'TotalBusinesses', [2026]) if 'TotalBusinesses' in summary.columns else [{"registrationYear": 2026, "TotalBusinesses": 0}]
        # compute appended summary
        renewals = renew_preds[0].get('Renewals', 0)
        total = total_preds[0].get('TotalBusinesses', 0)
        non = max(total - renewals, 0)
        summary = pd.concat([
            summary,
            pd.DataFrame({
                'registrationYear': [2026],
                'Renewals': [renewals],
                'TotalBusinesses': [total],
                'NonRenewals': [non]
            })
        ], ignore_index=True)
        summary = summary.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Renewal prediction successful!", "data": summary.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-renewals:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/predict-new-business', methods=['GET'])
def predict_new_business():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        new_business = compute_new_business_summary(df)
        new_preds = linear_forecast(new_business, 'NewBusiness', [2026])
        new_business = pd.concat([new_business, pd.DataFrame(new_preds)], ignore_index=True)
        new_business = new_business.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ New Business prediction successful!", "data": new_business.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-new-business:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/predict-total-forecast', methods=['GET'])
def predict_total_forecast():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        renewals_df = compute_renewals_summary(df)
        new_business_df = compute_new_business_summary(df)
        total = compute_total_forecast_df(renewals_df, new_business_df)
        preds = linear_forecast(total, 'TotalForecast', [2026])
        total = pd.concat([total, pd.DataFrame(preds)], ignore_index=True)
        total = total.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Total forecast successful!", "data": total.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-total-forecast:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/predict-comparison', methods=['GET'])
def predict_comparison():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        renewals_df = compute_renewals_summary(df)
        new_business_df = compute_new_business_summary(df)
        comp = compute_comparison_df(renewals_df, new_business_df)
        renew_preds = linear_forecast(renewals_df, 'Renewals', [2026])
        new_preds = linear_forecast(new_business_df, 'NewBusiness', [2026])
        merged_preds = pd.merge(pd.DataFrame(renew_preds), pd.DataFrame(new_preds), on='registrationYear', how='outer')
        comp = pd.concat([comp, merged_preds], ignore_index=True)
        comp = comp.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Comparison prediction successful!", "data": comp.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-comparison:", e)
        return jsonify({"error": str(e)}), 500


# Cached endpoints (fast; use these from frontend dashboard)
@app.route('/cache-renewals', methods=['GET'])
def cached_renewals():
    if cache.get('renewals'):
        return jsonify(cache['renewals'])
    else:
        return jsonify({"message": "Cache empty - warming", "data": []}), 202


@app.route('/cache-new-business', methods=['GET'])
def cached_new_business():
    if cache.get('new_business'):
        return jsonify(cache['new_business'])
    else:
        return jsonify({"message": "Cache empty - warming", "data": []}), 202


@app.route('/cache-total-forecast', methods=['GET'])
def cached_total_forecast():
    if cache.get('total_forecast'):
        return jsonify(cache['total_forecast'])
    else:
        return jsonify({"message": "Cache empty - warming", "data": []}), 202


@app.route('/cache-comparison', methods=['GET'])
def cached_comparison():
    if cache.get('comparison'):
        return jsonify(cache['comparison'])
    else:
        return jsonify({"message": "Cache empty - warming", "data": []}), 202


# === Start background cache refresher on startup ===
def start_background_tasks():
    t = Thread(target=cache_refresher, daemon=True)
    t.start()
    print("Background cache refresher started.")


# === Run app ===
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Flask ML API starting on port {port}")

    # Start cache refresher to preload cache immediately
    start_background_tasks()

    # Start the Flask server (blocking)
    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    finally:
        stop_event.set()
