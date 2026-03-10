const multer = require('multer');
const path = require('path');

// Use memory storage — files go to buffer, then we upload to GridFS
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg|pdf|doc|docx|png|jpg|jpeg/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
});

module.exports = upload;
