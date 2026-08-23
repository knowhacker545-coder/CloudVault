const fs = require("fs");
const File = require("../models/File");
const User = require("../models/User");
const { storagePathFor, deleteFile: removeFromDisk } = require("../config/storage");

const STORAGE_LIMIT = Number(process.env.STORAGE_LIMIT_BYTES) || 10 * 1024 * 1024 * 1024;

function detectCategory(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    ["application/zip", "application/x-zip-compressed", "application/x-rar-compressed"].includes(
      mimeType
    )
  )
    return "archive";
  if (
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ].includes(mimeType)
  )
    return "document";
  return "other";
}

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const user = await User.findById(req.userId);
    const newTotal = user.storageUsed + req.file.size;

    if (newTotal > STORAGE_LIMIT) {
      // Clean up the file multer already wrote to disk
      fs.unlink(req.file.path, () => {});
      return res.status(413).json({ message: "Storage limit exceeded" });
    }

    const file = await File.create({
      ownerId: req.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      category: detectCategory(req.file.mimetype),
      folderId: req.body.folderId || null,
    });

    user.storageUsed = newTotal;
    await user.save();

    res.status(201).json({ file });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { folderId, category, q } = req.query;
    const query = { ownerId: req.userId, deleted: false };
    if (folderId) query.folderId = folderId;
    if (category) query.category = category;
    if (q) query.originalName = { $regex: q, $options: "i" };

    const files = await File.find(query).sort({ createdAt: -1 });
    res.json({ files });
  } catch (err) {
    next(err);
  }
};

exports.trash = async (req, res, next) => {
  try {
    const files = await File.find({ ownerId: req.userId, deleted: true }).sort({ deletedAt: -1 });
    res.json({ files });
  } catch (err) {
    next(err);
  }
};

async function findOwnedFile(userId, fileId) {
  const file = await File.findById(fileId);
  if (!file) return { error: 404, message: "File not found" };
  if (String(file.ownerId) !== String(userId)) return { error: 403, message: "Access denied" };
  return { file };
}

exports.download = async (req, res, next) => {
  try {
    const { file, error, message } = await findOwnedFile(req.userId, req.params.id);
    if (error) return res.status(error).json({ message });

    const filePath = storagePathFor(file.ownerId, file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing from storage" });
    }

    res.download(filePath, file.originalName);
  } catch (err) {
    next(err);
  }
};

exports.softDelete = async (req, res, next) => {
  try {
    const { file, error, message } = await findOwnedFile(req.userId, req.params.id);
    if (error) return res.status(error).json({ message });

    file.deleted = true;
    file.deletedAt = new Date();
    await file.save();
    res.json({ message: "Moved to trash", file });
  } catch (err) {
    next(err);
  }
};

exports.restore = async (req, res, next) => {
  try {
    const { file, error, message } = await findOwnedFile(req.userId, req.params.id);
    if (error) return res.status(error).json({ message });

    file.deleted = false;
    file.deletedAt = null;
    await file.save();
    res.json({ message: "Restored", file });
  } catch (err) {
    next(err);
  }
};

exports.permanentDelete = async (req, res, next) => {
  try {
    const { file, error, message } = await findOwnedFile(req.userId, req.params.id);
    if (error) return res.status(error).json({ message });

    removeFromDisk(file.ownerId, file.storedName);
    await file.deleteOne();

    const user = await User.findById(req.userId);
    user.storageUsed = Math.max(0, user.storageUsed - file.size);
    await user.save();

    res.json({ message: "Permanently deleted" });
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const byCategory = await File.aggregate([
      { $match: { ownerId: user._id, deleted: false } },
      { $group: { _id: "$category", size: { $sum: "$size" }, count: { $sum: 1 } } },
    ]);

    res.json({
      storageUsed: user.storageUsed,
      storageLimit: STORAGE_LIMIT,
      byCategory,
    });
  } catch (err) {
    next(err);
  }
};
