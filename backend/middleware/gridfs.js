const mongoose = require('mongoose');
const { Readable } = require('stream');

/**
 * Get or create GridFS bucket instance.
 * Uses the default mongoose connection.
 */
let bucket;
function getBucket() {
    if (!bucket) {
        const db = mongoose.connection.db;
        bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    }
    return bucket;
}

/**
 * Upload a file buffer (from multer memory storage) to GridFS.
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @returns {Promise<ObjectId>} The GridFS file ID
 */
function uploadToGridFS(buffer, filename, contentType) {
    return new Promise((resolve, reject) => {
        const bucket = getBucket();
        const readStream = new Readable();
        readStream.push(buffer);
        readStream.push(null);

        const uploadStream = bucket.openUploadStream(filename, {
            contentType: contentType
        });

        readStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => resolve(uploadStream.id));
    });
}

/**
 * Delete a file from GridFS by its ObjectId.
 * @param {ObjectId|string} fileId
 */
async function deleteFromGridFS(fileId) {
    const bucket = getBucket();
    const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
    await bucket.delete(id);
}

/**
 * Stream a file from GridFS to an Express response.
 * Supports HTTP Range requests for video seeking.
 * @param {ObjectId|string} fileId
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function streamFromGridFS(fileId, req, res) {
    const bucket = getBucket();
    const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;

    // Find file metadata
    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    const fileSize = file.length;
    const contentType = file.contentType || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
        // Parse Range header (e.g., "bytes=0-1023")
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType
        });

        const downloadStream = bucket.openDownloadStream(id, { start, end: end + 1 });
        downloadStream.pipe(res);
        downloadStream.on('error', () => {
            if (!res.headersSent) res.status(500).json({ message: 'Error streaming file' });
        });
    } else {
        res.set({
            'Content-Type': contentType,
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes'
        });

        const downloadStream = bucket.openDownloadStream(id);
        downloadStream.pipe(res);
        downloadStream.on('error', () => {
            if (!res.headersSent) res.status(500).json({ message: 'Error streaming file' });
        });
    }
}

module.exports = { getBucket, uploadToGridFS, deleteFromGridFS, streamFromGridFS };
