const fs = require("fs");
const pool = require("../config/db");

const createSubmission = async (req, res) => {
  try {
    const { title, language, code: bodyCode } = req.body;

    let code;
    let fileName = null;

    if (req.file) {
      code = fs.readFileSync(req.file.path, "utf8");
      fileName = req.file.originalname;
    } else {
      code = bodyCode;
    }

    if (!title || !language || !code) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO submissions (user_id, title, language, code, file_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.userId, title, language, code, fileName]
    );

    res.status(201).json({
      success: true,
      submission: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = { createSubmission };