const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// Role check
const isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Access denied' });
    next();
};

router.use(authMiddleware, isTeacher);

// ==================== COURSES ====================

// GET all courses by teacher
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create course
router.post('/courses', async (req, res) => {
    try {
        const { title, description, category, duration } = req.body;
        const course = new Course({ title, description, category, duration, teacher: req.user.id });
        await course.save();
        res.status(201).json(course);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update course
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOneAndUpdate(
            { _id: req.params.id, teacher: req.user.id },
            req.body,
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE course
router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json({ message: 'Course deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST upload video to course (appends to videos array)
router.post('/courses/:id/upload-video', upload.single('video'), async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });
        const duration = req.body.duration ? Number(req.body.duration) : 0;
        course.videos.push({
            title: req.body.title || req.file.originalname,
            url: '/uploads/' + req.file.filename,
            duration: duration
        });
        await course.save();
        res.json({ videos: course.videos });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE a video from course
router.delete('/courses/:id/videos/:videoId', async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        course.videos = course.videos.filter(v => v._id.toString() !== req.params.videoId);
        await course.save();
        res.json({ videos: course.videos });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST upload PDF to course
router.post('/courses/:id/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        course.pdfFiles.push({ name: req.file.originalname, url: '/uploads/' + req.file.filename });
        await course.save();
        res.json({ pdfFiles: course.pdfFiles });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add assignment to course
router.post('/courses/:id/assignments', async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        const { title, description } = req.body;
        course.assignments.push({ title, description });
        await course.save();
        res.json({ assignments: course.assignments });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE assignment from course
router.delete('/courses/:id/assignments/:assignId', async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        course.assignments = course.assignments.filter(a => a._id.toString() !== req.params.assignId);
        await course.save();
        res.json({ assignments: course.assignments });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== QUIZZES ====================

// GET all quizzes by teacher
router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find({ teacher: req.user.id }).populate('course', 'title').sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create quiz
router.post('/quizzes', async (req, res) => {
    try {
        const { title, courseId, questions, timer, passingMarks } = req.body;
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const quiz = new Quiz({
            title, course: courseId, teacher: req.user.id,
            questions, timer, totalMarks, passingMarks
        });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update quiz
router.put('/quizzes/:id', async (req, res) => {
    try {
        const { title, courseId, questions, timer, passingMarks } = req.body;
        const totalMarks = questions ? questions.reduce((sum, q) => sum + (q.marks || 1), 0) : undefined;
        const quiz = await Quiz.findOneAndUpdate(
            { _id: req.params.id, teacher: req.user.id },
            { title, course: courseId, questions, timer, passingMarks, totalMarks },
            { new: true }
        );
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE quiz
router.delete('/quizzes/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json({ message: 'Quiz deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== PROGRESS ====================

// GET all students progress for teacher's courses
router.get('/progress', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id }, '_id title');
        const courseIds = courses.map(c => c._id);
        const enrollments = await Enrollment.find({ course: { $in: courseIds } })
            .populate('student', 'name email')
            .populate('course', 'title');
        const progressList = await Progress.find({ course: { $in: courseIds } })
            .populate('student', 'name email')
            .populate('course', 'title');
        res.json({ enrollments, progressList });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET specific student progress
router.get('/progress/:studentId', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user.id }, '_id');
        const courseIds = courses.map(c => c._id);
        const progressList = await Progress.find({
            student: req.params.studentId, course: { $in: courseIds }
        }).populate('course', 'title');
        const student = await User.findById(req.params.studentId).select('name email');
        res.json({ student, progressList });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==================== ANNOUNCEMENTS ====================

// GET all announcements by teacher
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find({ teacher: req.user.id }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create announcement
router.post('/announcements', async (req, res) => {
    try {
        const { title, body, courseId } = req.body;
        let courseName = 'All Students';
        let courseObj = null;

        if (courseId) {
            const course = await Course.findById(courseId);
            if (course) { courseName = course.title; courseObj = courseId; }
        }

        const announcement = new Announcement({
            teacher: req.user.id,
            teacherName: req.user.name,
            title, body,
            course: courseObj,
            courseName
        });
        await announcement.save();

        // Create notifications for enrolled students
        let studentIds = [];
        if (courseObj) {
            const enrollments = await Enrollment.find({ course: courseObj });
            studentIds = enrollments.map(e => e.student);
        } else {
            // All students enrolled in any of teacher's courses
            const courses = await Course.find({ teacher: req.user.id }, '_id');
            const courseIds = courses.map(c => c._id);
            const enrollments = await Enrollment.find({ course: { $in: courseIds } });
            studentIds = [...new Set(enrollments.map(e => e.student.toString()))];
        }

        const notifications = studentIds.map(sid => ({
            user: sid,
            message: `New announcement from ${req.user.name}: ${title}`,
            type: 'announcement',
            relatedId: announcement._id,
            link: '#/student/notifications'
        }));
        if (notifications.length > 0) await Notification.insertMany(notifications);

        res.status(201).json(announcement);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST reply to announcement
router.post('/announcements/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        announcement.replies.push({
            user: req.user.id,
            userName: req.user.name,
            userRole: req.user.role,
            message
        });
        await announcement.save();
        res.json(announcement);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all students list
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email createdAt');
        res.json(students);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
