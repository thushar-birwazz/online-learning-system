angular.module('lmsApp')
    .factory('QuizService', ['$http', function ($http) {
        const T = '/api/teacher';
        const S = '/api/student';

        return {
            // Teacher
            getTeacherQuizzes: () => $http.get(T + '/quizzes'),
            createQuiz: (data) => $http.post(T + '/quizzes', data),
            updateQuiz: (id, data) => $http.put(T + '/quizzes/' + id, data),
            deleteQuiz: (id) => $http.delete(T + '/quizzes/' + id),

            // Student
            getCourseQuizzes: (courseId) => $http.get(S + '/quizzes/' + courseId),
            submitQuiz: (data) => $http.post(S + '/quiz/submit', data)
        };
    }]);
