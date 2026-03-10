angular.module('lmsApp')
    .controller('StudentAnnouncementController', ['$scope', 'NotificationService',
        function ($scope, NotificationService) {
            $scope.announcements = [];
            $scope.loading = true;

            function loadAnnouncements() {
                NotificationService.getStudentAnnouncements().then(r => {
                    $scope.announcements = r.data;
                    $scope.loading = false;
                }).catch(() => { $scope.loading = false; });
            }
            loadAnnouncements();
        }]);
