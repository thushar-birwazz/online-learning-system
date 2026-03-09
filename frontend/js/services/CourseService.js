angular.module('lmsApp')
    .factory('CourseService', ['$http', function ($http) {
        const T = '/api/teacher';
        const S = '/api/student';

        return {
            // Teacher
            getTeacherCourses: () => $http.get(T + '/courses'),
            createCourse: (data) => $http.post(T + '/courses', data),
            updateCourse: (id, data) => $http.put(T + '/courses/' + id, data),
            deleteCourse: (id) => $http.delete(T + '/courses/' + id),
            uploadVideo: (id, formData) => $http.post(T + '/courses/' + id + '/upload-video', formData, {
                headers: { 'Content-Type': undefined }, transformRequest: angular.identity
            }),
            deleteVideo: (courseId, videoId) => $http.delete(T + '/courses/' + courseId + '/videos/' + videoId),
            uploadPdf: (id, formData) => $http.post(T + '/courses/' + id + '/upload-pdf', formData, {
                headers: { 'Content-Type': undefined }, transformRequest: angular.identity
            }),
            addAssignment: (id, data) => $http.post(T + '/courses/' + id + '/assignments', data),
            deleteAssignment: (courseId, assignId) => $http.delete(T + '/courses/' + courseId + '/assignments/' + assignId),

            // Student
            getAllCourses: () => $http.get(S + '/courses'),
            getMyCourses: () => $http.get(S + '/my-courses'),
            enroll: (courseId) => $http.post(S + '/enroll', { courseId }),
            updateVideoTime: (courseId, videoId, watchedSeconds, duration) => $http.post(S + '/progress/video-time', { courseId, videoId, watchedSeconds, duration }),
            markAssignmentDone: (courseId, assignmentId) => $http.post(S + '/progress/assignment', { courseId, assignmentId }),
            getCourseProgress: (courseId) => $http.get(S + '/progress/' + courseId),
            getAllProgress: () => $http.get(S + '/progress')
        };
    }]);
