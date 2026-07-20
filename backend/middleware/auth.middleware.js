const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded && typeof decoded === "object"
          ? decoded.userId ?? decoded.id ?? decoded.user_id
          : undefined;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload: missing user id.",
            });
        }

        req.user = { userId: Number(userId) };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

module.exports = authMiddleware;