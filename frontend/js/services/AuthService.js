angular.module('lmsApp')
    .factory('AuthService', ['$http', '$window', function ($http, $window) {
        const API = '/api/auth';

        return {
            register: function (data) {
                return $http.post(API + '/register', data);
            },
            login: function (data) {
                return $http.post(API + '/login', data);
            },
            setToken: function (token) {
                $window.localStorage.setItem('lms_token', token);
            },
            getToken: function () {
                return $window.localStorage.getItem('lms_token');
            },
            setUser: function (user) {
                $window.localStorage.setItem('lms_user', JSON.stringify(user));
            },
            getUser: function () {
                const u = $window.localStorage.getItem('lms_user');
                return u ? JSON.parse(u) : null;
            },
            logout: function () {
                $window.localStorage.removeItem('lms_token');
                $window.localStorage.removeItem('lms_user');
            },
            isLoggedIn: function () {
                return !!this.getToken() && !!this.getUser();
            }
        };
    }]);
