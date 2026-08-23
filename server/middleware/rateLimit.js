const rateLimit = require("express-rate-limit");

// 5 login/register attempts per minute per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in a minute." },
});

module.exports = { authLimiter };
