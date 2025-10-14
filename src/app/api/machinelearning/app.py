from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import os

app = Flask(__name__)
CORS(app)

# === Load dataset path ===
file_path = os.path.join(os.path.dirname(__file__), "ML_DATASET.csv")


# === Helper for regression ===
def linear_forecast(df, target_col, year_range):
    X = df[['registrationYear']]
    y = df[target_col]
    model = LinearRegression()
    model.fit(X, y)
    preds = []
    for year in year_range:
        pred = model.predict([[year]])[0]
        preds.append({"registrationYear": int(year), target_col: float(pred)})
    return preds


# === Root route ===
@app.route('/')
def home():
    return jsonify({"message": "✅ Flask ML API running fine!"})


# === 1️⃣ Renewal prediction ===
@app.route('/predict-renewals', methods=['GET'])
def predict_renewals():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        df = df[['registrationYear', 'willRenew']].dropna()

        df['willRenew'] = df['willRenew'].astype(str).map({'Yes': 1, 'No': 0})
        df['registrationYear'] = df['registrationYear'].astype(int)
        df = df[df['registrationYear'].between(2021, 2025)]

        renewals_per_year = df.groupby('registrationYear')['willRenew'].sum().reset_index(name='Renewals')
        total_per_year = df.groupby('registrationYear')['willRenew'].count().reset_index(name='TotalBusinesses')
        summary = pd.merge(renewals_per_year, total_per_year, on='registrationYear')
        summary['NonRenewals'] = summary['TotalBusinesses'] - summary['Renewals']

        renew_preds = linear_forecast(summary, 'Renewals', [2026])
        total_preds = linear_forecast(summary, 'TotalBusinesses', [2026])

        renewals = renew_preds[0]['Renewals']
        total = total_preds[0]['TotalBusinesses']
        non = max(total - renewals, 0)

        summary = pd.concat([
            summary,
            pd.DataFrame({
                'registrationYear': [2026],
                'Renewals': [renewals],
                'TotalBusinesses': [total],
                'NonRenewals': [non]
            })
        ])

        summary = summary.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Renewal prediction successful!", "data": summary.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-renewals:", e)
        return jsonify({"error": str(e)}), 500


# === 2️⃣ New Business prediction ===
@app.route('/predict-new-business', methods=['GET'])
def predict_new_business():
    try:
        df = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        df = df[['registrationYear', 'businessType']].dropna()
        df['registrationYear'] = df['registrationYear'].astype(int)
        df = df[df['registrationYear'].between(2021, 2025)]

        new_business = (
            df.groupby('registrationYear')['businessType']
            .count()
            .reset_index(name='NewBusiness')
        )

        new_preds = linear_forecast(new_business, 'NewBusiness', [2026])
        new_business = pd.concat([new_business, pd.DataFrame(new_preds)])

        new_business = new_business.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ New Business prediction successful!", "data": new_business.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-new-business:", e)
        return jsonify({"error": str(e)}), 500


# === 3️⃣ Total Forecast ===
@app.route('/predict-total-forecast', methods=['GET'])
def predict_total_forecast():
    try:
        renewals = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        renewals = renewals[['registrationYear', 'willRenew']].dropna()
        renewals['willRenew'] = renewals['willRenew'].astype(str).map({'Yes': 1, 'No': 0})
        renewals['registrationYear'] = renewals['registrationYear'].astype(int)
        renewals = renewals[renewals['registrationYear'].between(2021, 2025)]
        renewals_summary = renewals.groupby('registrationYear')['willRenew'].sum().reset_index(name='Renewals')

        business = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        business = business[['registrationYear', 'businessType']].dropna()
        business['registrationYear'] = business['registrationYear'].astype(int)
        business = business[business['registrationYear'].between(2021, 2025)]
        business_summary = business.groupby('registrationYear')['businessType'].count().reset_index(name='NewBusiness')

        total = pd.merge(renewals_summary, business_summary, on='registrationYear')
        total['TotalForecast'] = total['Renewals'] + total['NewBusiness']

        preds = linear_forecast(total, 'TotalForecast', [2026])
        total = pd.concat([total, pd.DataFrame(preds)])

        total = total.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Total forecast successful!", "data": total.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-total-forecast:", e)
        return jsonify({"error": str(e)}), 500


# === 4️⃣ Comparison prediction ===
@app.route('/predict-comparison', methods=['GET'])
def predict_comparison():
    try:
        renewals = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        renewals = renewals[['registrationYear', 'willRenew']].dropna()
        renewals['willRenew'] = renewals['willRenew'].astype(str).map({'Yes': 1, 'No': 0})
        renewals['registrationYear'] = renewals['registrationYear'].astype(int)
        renewals = renewals[renewals['registrationYear'].between(2021, 2025)]
        renewals_summary = renewals.groupby('registrationYear')['willRenew'].sum().reset_index(name='Renewals')

        business = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
        business = business[['registrationYear', 'businessType']].dropna()
        business['registrationYear'] = business['registrationYear'].astype(int)
        business = business[business['registrationYear'].between(2021, 2025)]
        business_summary = business.groupby('registrationYear')['businessType'].count().reset_index(name='NewBusiness')

        comp = pd.merge(renewals_summary, business_summary, on='registrationYear')

        renew_preds = linear_forecast(renewals_summary, 'Renewals', [2026])
        new_preds = linear_forecast(business_summary, 'NewBusiness', [2026])
        merged_preds = pd.merge(pd.DataFrame(renew_preds), pd.DataFrame(new_preds), on='registrationYear')
        comp = pd.concat([comp, merged_preds])

        comp = comp.replace([np.nan, np.inf, -np.inf], 0)
        return jsonify({"message": "✅ Comparison prediction successful!", "data": comp.to_dict(orient='records')})
    except Exception as e:
        print("Error /predict-comparison:", e)
        return jsonify({"error": str(e)}), 500


# === Run app ===
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Flask ML API running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
