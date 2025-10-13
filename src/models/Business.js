const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = global.Promise;
const mongoosePaginate = require('mongoose-paginate-v2');

const BusinessSchema = new Schema(
  {
    bidNumber: { type: String, unique: true, sparse: true },
    businessNickname: { type: String },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    businessAddress: { type: String, required: true },
    landmark: { type: String },
    contactPerson: { type: String },
    contactNumber: { type: String },
    requestType: { type: String },
    remarks: { type: String },
    businessEstablishment: { type: String },
    sanitaryPermitIssuedAt: { type: Date },

    // ✅ Checklist groups (based on your const names)
    sanitaryPermitChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true }
      }
    ],

    healthCertificateChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true }
      }
    ],
    msrChecklist: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        dueDate: { type: Date },
      }
    ],

    orDateHealthCert: { type: Date },
    orNumberHealthCert: { type: String },
    healthCertSanitaryFee: { type: Number, min: 0 },
    healthCertFee: { type: Number, min: 0 },

    declaredPersonnel: { type: Number },
    declaredPersonnelDueDate: { type: Date },
    healthCertificates: { type: Number },
    healthCertBalanceToComply: { type: Number },
    healthCertDueDate: { type: Date },

    onlineRequest: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'pending',
        'pending2',
        'pending3',
        'completed'
      ],
      default: 'draft'
    },

    businessAccount: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false
  }
);

BusinessSchema.plugin(mongoosePaginate);

module.exports =
  mongoose.models.Business || mongoose.model('Business', BusinessSchema);
