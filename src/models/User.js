const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = global.Promise;
const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = new Schema({
  profilePicture:         { type: String },
  email:                  { type: String, unique: true, required: true },
  password:               { type: String, required: true },

  // 👇 Make fullName conditionally required
  fullName: {
    type: String,
    required: function () {
      return this.role === 'officer'; // only required for officers
    },
  },

  role: {
    type: String,
    enum: ['business', 'officer', 'admin'],
    required: true
  },

  systemRole: {
    type: Number,
    enum: [0, 1, 2], // 0 = Super Admin, 1 = Admin, 2 = Moderator
  },
  systemRoleAssignedBy:   { type: Schema.Types.ObjectId, ref: "User" },

  accountDisabled:        { type: Boolean, default: false },
  accountWhoDisabled:     { type: Schema.Types.ObjectId, ref: "User" },

  assignedArea:           { type: String },
  hiredDate:              { type: Date },

  businessAccount:        { type: Schema.Types.ObjectId, ref: "User" },

  verified:               { type: Boolean, default: false },
  paid:                   { type: Boolean, default: false },
  verificationCode:       { type: String },
  systemMessageEnabled:   { type: Boolean, default: false },
  accountLocked:          { type: Boolean, default: false }
},
{
  timestamps: true,
  strict: true,
  strictQuery: false
});

UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
