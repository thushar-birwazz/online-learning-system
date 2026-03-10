angular.module('lmsApp')
    .factory('NotificationService', ['$http', function ($http) {
        const S = '/api/student';
        const T = '/api/teacher';

        return {
            getNotifications: () => $http.get(S + '/notifications'),
            markRead: (id) => $http.put(S + '/notifications/' + id + '/read'),
            markAllRead: () => $http.put(S + '/notifications/read-all'),

            // Announcements (both teacher and student)
            getTeacherAnnouncements: () => $http.get(T + '/announcements'),
            createAnnouncement: (data) => $http.post(T + '/announcements', data),

            getStudentAnnouncements: () => $http.get(S + '/announcements'),

            // Progress (Teacher viewing)
            getAllProgress: () => $http.get(T + '/progress'),
            getStudentProgress: (studentId) => $http.get(T + '/progress/' + studentId),
            getAllStudents: () => $http.get(T + '/students')
        };
    }]);
