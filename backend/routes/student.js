const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Access denied' });
    next();
};

router.use(authMiddleware, isStudent);

// ==================== COURSES ====================

// GET all available courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('teacher', 'name email').sort({ createdAt: -1 });
        // Add enrollment status
        const enrollments = await Enrollment.find({ student: req.user.id });
        const enrolledIds = enrollments.map(e => e.course.toString());
        const result = courses.map(c => ({
            ...c._doc || c.toObject(),
            isEnrolled: enrolledIds.includes(c._id.toString())
        }));
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET enrolled courses
router.get('/my-courses', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id }).populate({
            path: 'course', populate: { path: 'teacher', select: 'name' }
        });
        const courses = enrollments.map(e => e.course);
        // Get progress for each
        const progressList = await Progress.find({ student: req.user.id });
        const result = courses.map(c => {
            const prog = progressList.find(p => p.course.toString() === c._id.toString());
            return { ...c.toObject(), progress: prog ? prog.percentage : 0 };
        });
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST enroll in a course
router.post('/enroll', async (req, res) => {
    try {
        const { courseId } = req.body;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });
        if (existing) return res.status(400).json({ message: 'Already enrolled' });
        await Enrollment.create({ student: req.user.id, course: courseId });
        // Initialize progress
        await Progress.findOneAndUpdate(
            { student: req.user.id, course: courseId },
            { $setOnInsert: { student: req.user.id, course: courseId } },
            { upsert: true, new: true }
        );
        res.json({ message: 'Enrolled successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== PROGRESS ====================

// POST update video watch time
router.post('/progress/video-time', async (req, res) => {
    try {
        const { courseId, videoId, watchedSeconds, duration } = req.body;
        let progress = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!progress) {
            progress = new Progress({ student: req.user.id, course: courseId });
        }
        // Find or create video progress entry
        let vp = progress.videoProgress.find(v => v.videoId && v.videoId.toString() === videoId);
        if (!vp) {
            progress.videoProgress.push({ videoId: videoId, watchedSeconds: 0, completed: false });
            vp = progress.videoProgress[progress.videoProgress.length - 1];
        }
        // Only update if new time is greater (no going backwards)
        if (watchedSeconds > vp.watchedSeconds) {
            vp.watchedSeconds = watchedSeconds;
        }
        // Mark completed if watched >= 90% of duration
        if (duration > 0 && vp.watchedSeconds >= duration * 0.9) {
            vp.completed = true;
        }
        // Calculate total watched seconds
        progress.totalWatchedSeconds = progress.videoProgress.reduce((sum, v) => sum + v.watchedSeconds, 0);
        // Recalculate percentage based on course video durations
        const course = await Course.findById(courseId);
        progress.percentage = calculatePercentage(progress, course);
        progress.lastUpdated = new Date();
        await progress.save();
        res.json(progress);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST mark assignment completed
router.post('/progress/assignment', async (req, res) => {
    try {
        const { courseId, assignmentId } = req.body;
        let progress = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!progress) progress = new Progress({ student: req.user.id, course: courseId });
        if (!progress.assignmentsCompleted.includes(assignmentId)) {
            progress.assignmentsCompleted.push(assignmentId);
            if (!progress.completedLessons.includes('assignment_' + assignmentId)) {
                progress.completedLessons.push('assignment_' + assignmentId);
            }
        }
        const course = await Course.findById(courseId);
        progress.percentage = calculatePercentage(progress, course);
        progress.lastUpdated = new Date();
        await progress.save();
        res.json(progress);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET progress for a course
router.get('/progress/:courseId', async (req, res) => {
    try {
        const progress = await Progress.findOne({ student: req.user.id, course: req.params.courseId })
            .populate('course', 'title assignments');
        res.json(progress || { percentage: 0, quizScores: [], completedLessons: [] });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all progress
router.get('/progress', async (req, res) => {
    try {
        const progressList = await Progress.find({ student: req.user.id }).populate('course', 'title');
        res.json(progressList);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

function calculatePercentage(progress, course) {
    if (!course || !course.videos || course.videos.length === 0) return 0;
    const totalDuration = course.videos.reduce((sum, v) => sum + (v.duration || 0), 0);
    if (totalDuration === 0) {
        // If no durations set, use completion count instead
        const completed = progress.videoProgress.filter(v => v.completed).length;
        return Math.round((completed / course.videos.length) * 100);
    }
    const pct = Math.round((progress.totalWatchedSeconds / totalDuration) * 100);
    return Math.min(pct, 100);
}

// ==================== QUIZZES ====================

// GET quizzes for a course
router.get('/quizzes/:courseId', async (req, res) => {
    try {
        const enrolled = await Enrollment.findOne({ student: req.user.id, course: req.params.courseId });
        if (!enrolled) return res.status(403).json({ message: 'Not enrolled in this course' });
        const quizzes = await Quiz.find({ course: req.params.courseId });
        // Hide correct answers
        const safeQuizzes = quizzes.map(q => ({
            _id: q._id,
            title: q.title,
            timer: q.timer,
            totalMarks: q.totalMarks,
            passingMarks: q.passingMarks,
            questions: q.questions.map(ques => ({
                _id: ques._id,
                text: ques.text,
                options: ques.options,
                marks: ques.marks
            }))
        }));
        res.json(safeQuizzes);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST submit quiz
router.post('/quiz/submit', async (req, res) => {
    try {
        const { quizId, courseId, answers } = req.body;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let score = 0;
        const detailedAnswers = quiz.questions.map((q, i) => {
            const selected = answers[i] !== undefined ? answers[i] : -1;
            const isCorrect = selected === q.correctAnswer;
            if (isCorrect) score += q.marks;
            return { questionIndex: i, selectedOption: selected, isCorrect };
        });

        const percentage = quiz.totalMarks > 0 ? Math.round((score / quiz.totalMarks) * 100) : 0;

        let progress = await Progress.findOne({ student: req.user.id, course: courseId });
        if (!progress) progress = new Progress({ student: req.user.id, course: courseId });

        progress.quizScores.push({
            quiz: quizId,
            quizTitle: quiz.title,
            score,
            totalMarks: quiz.totalMarks,
            percentage,
            answers: detailedAnswers
        });
        const course = await Course.findById(courseId);
        progress.percentage = calculatePercentage(progress, course);
        progress.lastUpdated = new Date();
        await progress.save();

        res.json({
            score, totalMarks: quiz.totalMarks, percentage,
            passed: score >= quiz.passingMarks,
            answers: detailedAnswers,
            correctAnswers: quiz.questions.map(q => q.correctAnswer)
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== NOTIFICATIONS ====================

router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/notifications/read-all', async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: 'All marked as read' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== ANNOUNCEMENTS ====================

router.get('/announcements', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id });
        const courseIds = enrollments.map(e => e.course);
        const announcements = await Announcement.find({
            $or: [{ course: { $in: courseIds } }, { course: null }]
        }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) { res.status(500).json({ message: err.message }); }
});




module.exports = router;
