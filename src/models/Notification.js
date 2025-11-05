import mongoose, { Schema } from "mongoose";

mongoose.Promise = global.Promise;

const NotificationSchema = new Schema(
  {
    // 🧠 Who will see this notification
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // 🏢 Optional link to business or ticket
    business: { type: Schema.Types.ObjectId, ref: "Business", default: null },
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", default: null },

    // 🏷️ Short label (ex: "Inspection Created", "Permit Released")
    title: { type: String, default: "" },

    // 📝 Full message body
    message: { type: String, required: true },

    // ⚙️ Notification type for event categorization
    type: {
      type: String,
      enum: [
        "inspection_created",
        "inspection_completed",
        "violation_issued",
        "permit_released",
        "general",
      ],
      default: "general",
    },

    // 📅 Read/unread status
    isRead: { type: Boolean, default: false },

    // 🗑️ Soft delete (for hiding old notifications without removing from DB)
    isDeleted: { type: Boolean, default: false },

    // 🔗 Optional redirect link when clicked
    link: { type: String, default: "" },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

// ✅ Avoid model overwrite error in Next.js (important for hot reloads)
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
