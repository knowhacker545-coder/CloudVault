const fs = require("fs");
const Share = require("../models/Share");
const File = require("../models/File");
const { storagePathFor } = require("../config/storage");

const EXPIRY_OPTIONS = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  never: null,
};

exports.createShare = async (req, res, next) => {
  try {
    const { fileId, expiresIn = "7d", allowDownload = true } = req.body;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (String(file.ownerId) !== String(req.userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const durationMs = EXPIRY_OPTIONS[expiresIn];
    const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

    const share = await Share.create({
      fileId: file._id,
      ownerId: req.userId,
      allowDownload,
      expiresAt,
    });

    res.status(201).json({
      shareUrl: `/share/${share.token}`,
      token: share.token,
      expiresAt: share.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

exports.resolveShare = async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token });
    if (!share) return res.status(404).json({ message: "Link not found" });
    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(410).json({ message: "This link has expired" });
    }

    const file = await File.findById(share.fileId);
    if (!file || file.deleted) {
      return res.status(404).json({ message: "File no longer available" });
    }

    if (!share.allowDownload) {
      return res.json({
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        downloadAllowed: false,
      });
    }

    const filePath = storagePathFor(file.ownerId, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing from storage" });
    }
    res.download(filePath, file.originalName);
  } catch (err) {
    next(err);
  }
};
