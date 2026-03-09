angular.module('lmsApp')
    .controller('StudentNotificationController', ['$scope', 'NotificationService',
        function ($scope, NotificationService) {
            $scope.notifications = [];
            $scope.unreadCount = 0;
            $scope.loading = true;

            function loadNotifs() {
                NotificationService.getNotifications().then(r => {
                    $scope.notifications = r.data.notifications || [];
                    $scope.unreadCount = r.data.unreadCount || 0;
                    $scope.loading = false;
                }).catch(() => { $scope.loading = false; });
            }
            loadNotifs();

            $scope.markRead = function (notif) {
                if (notif.isRead) return;
                NotificationService.markRead(notif._id).then(() => {
                    notif.isRead = true;
                    $scope.unreadCount = Math.max(0, $scope.unreadCount - 1);
                });
            };

            $scope.markAllRead = function () {
                NotificationService.markAllRead().then(() => {
                    $scope.notifications.forEach(n => n.isRead = true);
                    $scope.unreadCount = 0;
                });
            };
        }]);
