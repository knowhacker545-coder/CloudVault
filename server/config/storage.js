// Local-disk storage engine (100% free, works out of the box).
// When you're ready to move to AWS S3, swap the implementation of
// saveFile / getFileStream / deleteFile below to use the AWS SDK
// (S3Client + PutObjectCommand / GetObjectCommand / DeleteObjectCommand)
// and generate presigned URLs instead of serving through /uploads.

const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function storagePathFor(userId, storedName) {
  const userDir = path.join(UPLOAD_DIR, String(userId));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return path.join(userDir, storedName);
}

function deleteFile(userId, storedName) {
  const filePath = storagePathFor(userId, storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = { UPLOAD_DIR, storagePathFor, deleteFile };
