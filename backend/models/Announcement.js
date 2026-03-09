const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userRole: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: String,
    title: { type: String, required: true },
    body: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    courseName: { type: String, default: 'All Students' },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
