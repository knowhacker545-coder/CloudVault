const mongoose = require("mongoose");
const crypto = require("crypto");

const shareSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(9).toString("base64url"),
    },
    allowDownload: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null }, // null = never
  },
  { timestamps: true }
);

module.exports = mongoose.model("Share", shareSchema);
