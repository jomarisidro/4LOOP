const mongoose = require('mongoose');
const { Schema } = mongoose;

const ViolationSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },

    code: {
      type: String,
      enum: [
        'no_sanitary_permit',
        'no_health_certificate',
        'failure_display_sanitary',
        'failure_display_health',
        'failure_renew_sanitary',
        'failure_renew_health',
        'tampered_documents',
        'fake_documents',
        'expired_documents',
        'other',
      ],
      required: true,
    },

    ordinanceSection: {
      type: String,
      default: 'Ordinance No. 53, s.2022',
    },

    description: { type: String },
    penalty: { type: Number, default: 0 },
    offenseCount: { type: Number, default: 1 },

    violationStatus: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Violation || mongoose.model('Violation', ViolationSchema);
