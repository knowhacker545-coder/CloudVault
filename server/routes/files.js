const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const router = express.Router();

const requireAuth = require("../middleware/auth");
const { UPLOAD_DIR } = require("../config/storage");
const fileController = require("../controllers/fileController");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, String(req.userId));
    require("fs").mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("File type not allowed"));
    }
    cb(null, true);
  },
});

router.use(requireAuth);

router.post("/upload", upload.single("file"), fileController.upload);
router.get("/", fileController.list);
router.get("/trash", fileController.trash);
router.get("/stats", fileController.stats);
router.get("/:id/download", fileController.download);
router.delete("/:id", fileController.softDelete);
router.post("/:id/restore", fileController.restore);
router.delete("/:id/permanent", fileController.permanentDelete);

module.exports = router;
