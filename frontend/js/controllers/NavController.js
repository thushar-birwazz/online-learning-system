angular.module('lmsApp')
    .controller('NavController', ['$scope', '$location', 'AuthService', 'NotificationService',
        function ($scope, $location, AuthService, NotificationService) {
            $scope.user = AuthService.getUser();
            $scope.unreadCount = 0;

            $scope.isLoggedIn = function () { return AuthService.isLoggedIn(); };

            $scope.logout = function () {
                AuthService.logout();
                $scope.user = null;
                $location.path('/login');
            };

            // Poll notifications for student
            function loadUnread() {
                const u = AuthService.getUser();
                if (u && u.role === 'student') {
                    NotificationService.getNotifications().then(r => {
                        $scope.unreadCount = r.data.unreadCount || 0;
                    });
                }
            }

            loadUnread();
            setInterval(loadUnread, 30000);
        }]);
