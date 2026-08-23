const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true }, // name on disk (uuid-based)
    size: { type: Number, required: true }, // bytes
    mimeType: { type: String, required: true },
    category: {
      type: String,
      enum: ["image", "video", "document", "audio", "archive", "other"],
      default: "other",
    },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fileSchema.index({ ownerId: 1, originalName: "text" });

module.exports = mongoose.model("File", fileSchema);
