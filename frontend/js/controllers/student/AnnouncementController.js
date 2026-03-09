angular.module('lmsApp')
    .controller('StudentAnnouncementController', ['$scope', 'NotificationService',
        function ($scope, NotificationService) {
            $scope.announcements = [];
            $scope.loading = true;
            $scope.replyText = {};
            $scope.message = '';

            function loadAnnouncements() {
                NotificationService.getStudentAnnouncements().then(r => {
                    $scope.announcements = r.data;
                    $scope.loading = false;
                }).catch(() => { $scope.loading = false; });
            }
            loadAnnouncements();

            $scope.reply = function (announcement) {
                if (!$scope.replyText[announcement._id]) return;
                NotificationService.replyStudent(announcement._id, { message: $scope.replyText[announcement._id] }).then(r => {
                    $scope.replyText[announcement._id] = '';
                    $scope.message = 'Reply posted!';
                    loadAnnouncements();
                });
            };
        }]);
