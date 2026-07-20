const multer = require('multer');

// CSV files only, kept in memory (never written to disk) since we only
// ever need the buffer momentarily to parse + validate it.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv'
        || file.mimetype === 'application/vnd.ms-excel'
        || file.originalname.toLowerCase().endsWith('.csv');

    if (!isCsv) {
        return cb(new Error('Only .csv files are accepted for bulk upload.'));
    }
    cb(null, true);
};

const uploadCsv = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB is generous for a 50-row CSV
});

module.exports = { uploadCsv };