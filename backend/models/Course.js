const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    url: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId },
    duration: { type: Number, default: 0 } // in seconds
});

const pdfFileSchema = new mongoose.Schema({
    name: String,
    url: String,
    fileId: { type: mongoose.Schema.Types.ObjectId }
});

const assignmentSchema = new mongoose.Schema({
    title: String,
    description: String,
    fileUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videos: [videoSchema],
    pdfFiles: [pdfFileSchema],
    assignments: [assignmentSchema],
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'General' },
    duration: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
