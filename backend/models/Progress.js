const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId },
    watchedSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
});

const quizScoreSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    quizTitle: String,
    score: Number,
    totalMarks: Number,
    percentage: Number,
    answers: [{ questionIndex: Number, selectedOption: Number, isCorrect: Boolean }],
    attemptedAt: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: String }],
    videoProgress: [videoProgressSchema],
    totalWatchedSeconds: { type: Number, default: 0 },
    assignmentsCompleted: [{ type: String }],
    quizScores: [quizScoreSchema],
    percentage: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

progressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
