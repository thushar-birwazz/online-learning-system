angular.module('lmsApp')
    .controller('AuthController', ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            $scope.loginData = {};
            $scope.registerData = {};
            $scope.errorMsg = '';
            $scope.successMsg = '';
            $scope.loading = false;

            $scope.login = function () {
                $scope.errorMsg = '';
                $scope.loading = true;
                AuthService.login($scope.loginData).then(function (res) {
                    AuthService.setToken(res.data.token);
                    AuthService.setUser(res.data.user);
                    if (res.data.user.role === 'teacher') $location.path('/teacher/dashboard');
                    else $location.path('/student/dashboard');
                }).catch(function (err) {
                    $scope.errorMsg = err.data ? err.data.message : 'Login failed. Check credentials.';
                }).finally(function () {
                    $scope.loading = false;
                });
            };

            $scope.register = function () {
                $scope.errorMsg = '';
                $scope.loading = true;
                AuthService.register($scope.registerData).then(function (res) {
                    AuthService.setToken(res.data.token);
                    AuthService.setUser(res.data.user);
                    if (res.data.user.role === 'teacher') $location.path('/teacher/dashboard');
                    else $location.path('/student/dashboard');
                }).catch(function (err) {
                    $scope.errorMsg = err.data ? err.data.message : 'Registration failed.';
                }).finally(function () {
                    $scope.loading = false;
                });
            };
        }]);
