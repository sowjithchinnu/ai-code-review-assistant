const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const ALLOWED_EXTENSIONS = new Set([
    ".js",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".ts",
    ".go",
    ".rs",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, "_");
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_EXTENSIONS.has(ext)) {
        cb(null, true);
        return;
    }

    cb(
        new Error(
            `Invalid file type. Allowed extensions: ${[...ALLOWED_EXTENSIONS].join(", ")}`
        )
    );
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

module.exports = upload;
