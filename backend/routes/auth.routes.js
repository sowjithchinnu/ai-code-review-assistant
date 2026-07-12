const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const { signup, login, getCurrentUser } = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;