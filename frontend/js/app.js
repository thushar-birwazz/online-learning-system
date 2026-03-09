angular.module('lmsApp', ['ngRoute'])

    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix('');
        $routeProvider
            // Auth
            .when('/', { templateUrl: 'views/auth/login.html', controller: 'AuthController' })
            .when('/login', { templateUrl: 'views/auth/login.html', controller: 'AuthController' })
            .when('/register', { templateUrl: 'views/auth/register.html', controller: 'AuthController' })

            // Teacher
            .when('/teacher/dashboard', { templateUrl: 'views/teacher/dashboard.html', controller: 'TeacherDashboardController' })
            .when('/teacher/courses', { templateUrl: 'views/teacher/courses.html', controller: 'TeacherCourseController' })
            .when('/teacher/quizzes', { templateUrl: 'views/teacher/quiz-create.html', controller: 'TeacherQuizController' })
            .when('/teacher/progress', { templateUrl: 'views/teacher/progress.html', controller: 'TeacherProgressController' })
            .when('/teacher/announcements', { templateUrl: 'views/teacher/announcements.html', controller: 'TeacherAnnouncementController' })

            // Student
            .when('/student/dashboard', { templateUrl: 'views/student/dashboard.html', controller: 'StudentDashboardController' })
            .when('/student/courses', { templateUrl: 'views/student/courses.html', controller: 'StudentCourseController' })
            .when('/student/lesson/:courseId', { templateUrl: 'views/student/lesson.html', controller: 'StudentLessonController' })
            .when('/student/quiz/:courseId', { templateUrl: 'views/student/quiz.html', controller: 'StudentQuizController' })
            .when('/student/progress', { templateUrl: 'views/student/progress.html', controller: 'StudentProgressController' })
            .when('/student/notifications', { templateUrl: 'views/student/notifications.html', controller: 'StudentNotificationController' })
            .when('/student/announcements', { templateUrl: 'views/student/announcements.html', controller: 'StudentAnnouncementController' })

            .otherwise({ redirectTo: '/' });
    }])

    .run(['$rootScope', '$location', 'AuthService', function ($rootScope, $location, AuthService) {
        $rootScope.$on('$routeChangeStart', function (event, next) {
            const user = AuthService.getUser();
            const path = $location.path();

            // Redirect logged-in users from auth pages
            if (user && (path === '/login' || path === '/register' || path === '/')) {
                if (user.role === 'teacher') $location.path('/teacher/dashboard');
                else $location.path('/student/dashboard');
                return;
            }

            // Protect teacher routes
            if (path.startsWith('/teacher') && (!user || user.role !== 'teacher')) {
                $location.path('/login');
                return;
            }

            // Protect student routes
            if (path.startsWith('/student') && (!user || user.role !== 'student')) {
                $location.path('/login');
                return;
            }
        });
    }])

    // HTTP interceptor to attach JWT — use $window directly to avoid circular dependency
    .factory('authInterceptor', ['$window', function ($window) {
        return {
            request: function (config) {
                var token = $window.localStorage.getItem('lms_token');
                if (token) config.headers['Authorization'] = 'Bearer ' + token;
                return config;
            }
        };
    }])

    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    }])

    // Trust URL filter for video ng-src
    .filter('trustUrl', ['$sce', function ($sce) {
        return function (url) {
            return $sce.trustAsResourceUrl(url);
        };
    }]);
