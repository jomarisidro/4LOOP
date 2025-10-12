import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

mongoose.Promise = global.Promise;

const UserSchema = new Schema(
  {
    profilePicture: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    // 👇 Conditionally required only for officer accounts
    fullName: {
      type: String,
      required: function () {
        return this.role === "officer";
      },
    },

    role: {
      type: String,
      enum: ["business", "officer", "admin"],
      required: true,
    },

    systemRole: {
      type: Number,
      enum: [0, 1, 2], // 0 = Super Admin, 1 = Admin, 2 = Moderator
    },
    systemRoleAssignedBy: { type: Schema.Types.ObjectId, ref: "User" },

    accountDisabled: { type: Boolean, default: false },
    accountWhoDisabled: { type: Schema.Types.ObjectId, ref: "User" },

    assignedArea: { type: String },
    hiredDate: { type: Date },

    businessAccount: { type: Schema.Types.ObjectId, ref: "User" },

    verified: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpiry: { type: Date },
    systemMessageEnabled: { type: Boolean, default: false },
    accountLocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: false,
  }
);

UserSchema.plugin(mongoosePaginate);

export default mongoose.models.User || mongoose.model("User", UserSchema);
