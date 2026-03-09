angular.module('lmsApp')
    .controller('StudentDashboardController', ['$scope', 'CourseService', 'NotificationService', 'AuthService',
        function ($scope, CourseService, NotificationService, AuthService) {
            $scope.user = AuthService.getUser();
            $scope.courses = [];
            $scope.progressList = [];
            $scope.recentNotifications = [];
            $scope.loading = true;

            CourseService.getMyCourses().then(r => {
                $scope.courses = r.data;
                $scope.loading = false;
            }).catch(() => { $scope.loading = false; });

            CourseService.getAllProgress().then(r => { $scope.progressList = r.data; });

            NotificationService.getNotifications().then(r => {
                $scope.recentNotifications = (r.data.notifications || []).slice(0, 5);
                $scope.unreadCount = r.data.unreadCount || 0;
            });

            $scope.getOverallProgress = function () {
                if (!$scope.progressList.length) return 0;
                const avg = $scope.progressList.reduce((s, p) => s + (p.percentage || 0), 0) / $scope.progressList.length;
                return Math.round(avg);
            };
        }]);
