const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const { createShare, resolveShare } = require("../controllers/shareController");

router.post("/", requireAuth, createShare);
router.get("/:token", resolveShare); // public - anyone with the link

module.exports = router;
