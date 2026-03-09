angular.module('lmsApp')
    .controller('TeacherDashboardController', ['$scope', 'CourseService', 'QuizService', 'NotificationService', 'AuthService',
        function ($scope, CourseService, QuizService, NotificationService, AuthService) {
            $scope.user = AuthService.getUser();
            $scope.courses = [];
            $scope.quizzes = [];
            $scope.students = [];
            $scope.enrollments = [];
            $scope.loading = true;

            function loadData() {
                CourseService.getTeacherCourses().then(r => { $scope.courses = r.data; });
                QuizService.getTeacherQuizzes().then(r => { $scope.quizzes = r.data; });
                NotificationService.getAllStudents().then(r => { $scope.students = r.data; });
                NotificationService.getAllProgress().then(r => {
                    $scope.enrollments = r.data.enrollments || [];
                    $scope.loading = false;
                }).catch(() => { $scope.loading = false; });
            }
            loadData();

            $scope.totalCourses = function () { return $scope.courses.length; };
            $scope.totalQuizzes = function () { return $scope.quizzes.length; };
            $scope.totalStudents = function () { return $scope.students.length; };
            $scope.totalEnrollments = function () { return $scope.enrollments.length; };
        }]);
