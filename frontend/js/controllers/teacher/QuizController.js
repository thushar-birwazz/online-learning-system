angular.module('lmsApp')
    .controller('TeacherQuizController', ['$scope', 'QuizService', 'CourseService',
        function ($scope, QuizService, CourseService) {
            $scope.quizzes = [];
            $scope.courses = [];
            $scope.showForm = false;
            $scope.editMode = false;
            $scope.message = '';
            $scope.errorMsg = '';

            $scope.formData = {
                title: '',
                courseId: '',
                timer: 10,
                passingMarks: 0,
                questions: []
            };

            function loadData() {
                QuizService.getTeacherQuizzes().then(r => { $scope.quizzes = r.data; });
                CourseService.getTeacherCourses().then(r => { $scope.courses = r.data; });
            }
            loadData();

            $scope.openAddForm = function () {
                $scope.formData = { title: '', courseId: '', timer: 10, passingMarks: 0, questions: [] };
                $scope.editMode = false;
                $scope.showForm = true;
                $scope.addQuestion();
            };

            $scope.openEditForm = function (quiz) {
                $scope.formData = {
                    _id: quiz._id,
                    title: quiz.title,
                    courseId: quiz.course ? quiz.course._id : '',
                    timer: quiz.timer,
                    passingMarks: quiz.passingMarks,
                    questions: angular.copy(quiz.questions)
                };
                $scope.editMode = true;
                $scope.showForm = true;
            };

            $scope.cancelForm = function () { $scope.showForm = false; };

            $scope.addQuestion = function () {
                $scope.formData.questions.push({
                    text: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    marks: 1
                });
            };

            $scope.removeQuestion = function (index) {
                if ($scope.formData.questions.length > 1) {
                    $scope.formData.questions.splice(index, 1);
                }
            };

            $scope.saveQuiz = function () {
                $scope.errorMsg = '';
                const data = {
                    title: $scope.formData.title,
                    courseId: $scope.formData.courseId,
                    timer: parseInt($scope.formData.timer),
                    passingMarks: parseInt($scope.formData.passingMarks),
                    questions: $scope.formData.questions.map(q => ({
                        text: q.text,
                        options: q.options,
                        correctAnswer: parseInt(q.correctAnswer),
                        marks: parseInt(q.marks)
                    }))
                };

                if ($scope.editMode) {
                    QuizService.updateQuiz($scope.formData._id, data).then(r => {
                        $scope.message = 'Quiz updated!';
                        $scope.showForm = false;
                        loadData();
                    }).catch(e => { $scope.errorMsg = e.data ? e.data.message : 'Error saving quiz'; });
                } else {
                    QuizService.createQuiz(data).then(r => {
                        $scope.message = 'Quiz created!';
                        $scope.showForm = false;
                        loadData();
                    }).catch(e => { $scope.errorMsg = e.data ? e.data.message : 'Error saving quiz'; });
                }
            };

            $scope.deleteQuiz = function (id) {
                if (!confirm('Delete this quiz?')) return;
                QuizService.deleteQuiz(id).then(() => {
                    $scope.message = 'Quiz deleted';
                    loadData();
                });
            };

            $scope.getCourseName = function (quiz) {
                return quiz.course ? quiz.course.title : 'Unknown';
            };
        }]);
