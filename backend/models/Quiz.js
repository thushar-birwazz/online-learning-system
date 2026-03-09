const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Number, required: true }, // index of correct option 0-3
    marks: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    timer: { type: Number, default: 10 }, // in minutes
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
