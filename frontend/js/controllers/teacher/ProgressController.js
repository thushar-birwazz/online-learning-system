angular.module('lmsApp')
    .controller('TeacherProgressController', ['$scope', 'NotificationService',
        function ($scope, NotificationService) {
            $scope.enrollments = [];
            $scope.progressList = [];
            $scope.students = [];
            $scope.selectedStudent = null;
            $scope.studentProgress = [];
            $scope.loading = true;
            $scope.activeTab = 'overview';

            function loadAll() {
                NotificationService.getAllProgress().then(r => {
                    $scope.enrollments = r.data.enrollments || [];
                    $scope.progressList = r.data.progressList || [];
                    // Build unique students list
                    const map = {};
                    $scope.enrollments.forEach(e => {
                        if (e.student && !map[e.student._id]) {
                            map[e.student._id] = e.student;
                        }
                    });
                    $scope.students = Object.values(map);
                    $scope.loading = false;
                }).catch(() => { $scope.loading = false; });
            }
            loadAll();

            $scope.viewStudent = function (student) {
                $scope.selectedStudent = student;
                $scope.activeTab = 'detail';
                NotificationService.getStudentProgress(student._id).then(r => {
                    $scope.studentProgress = r.data.progressList || [];
                });
            };

            $scope.getProgress = function (studentId, courseId) {
                const p = $scope.progressList.find(p =>
                    p.student && p.student._id === studentId &&
                    p.course && p.course._id === courseId
                );
                return p ? p.percentage : 0;
            };

            $scope.getStudentEnrollments = function (studentId) {
                return $scope.enrollments.filter(e => e.student && e.student._id === studentId);
            };

            $scope.getAvgScore = function (scores) {
                if (!scores || scores.length === 0) return 'N/A';
                const avg = scores.reduce((s, q) => s + q.percentage, 0) / scores.length;
                return avg.toFixed(1) + '%';
            };

            $scope.getAvgProgress = function (studentId) {
                var studentProgs = $scope.progressList.filter(function (p) {
                    return p.student && p.student._id === studentId;
                });
                if (!studentProgs.length) return 0;
                var total = studentProgs.reduce(function (sum, p) { return sum + (p.percentage || 0); }, 0);
                return Math.round(total / studentProgs.length);
            };

            $scope.formatTime = function (seconds) {
                if (!seconds || seconds <= 0) return '0:00';
                var m = Math.floor(seconds / 60);
                var s = Math.round(seconds % 60);
                return m + ':' + (s < 10 ? '0' : '') + s;
            };
        }]);
