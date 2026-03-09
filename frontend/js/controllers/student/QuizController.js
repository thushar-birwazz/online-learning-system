angular.module('lmsApp')
    .controller('StudentQuizController', ['$scope', '$routeParams', '$interval', '$location', 'QuizService', 'CourseService',
        function ($scope, $routeParams, $interval, $location, QuizService, CourseService) {
            $scope.courseId = $routeParams.courseId;
            $scope.quizzes = [];
            $scope.selectedQuiz = null;
            $scope.answers = [];
            $scope.timeLeft = 0;
            $scope.timerInterval = null;
            $scope.result = null;
            $scope.quizStarted = false;
            $scope.quizSubmitted = false;
            $scope.loading = true;
            $scope.attemptedQuizIds = [];

            QuizService.getCourseQuizzes($scope.courseId).then(r => {
                $scope.quizzes = r.data;
                $scope.loading = false;
            }).catch(() => { $scope.loading = false; });

            // Load progress to check which quizzes are already attempted
            CourseService.getCourseProgress($scope.courseId).then(r => {
                $scope.progressData = r.data;
                if (r.data && r.data.quizScores) {
                    $scope.attemptedQuizIds = r.data.quizScores.map(function (qs) { return qs.quiz; });
                }
            });

            $scope.isQuizAttempted = function (quizId) {
                return $scope.attemptedQuizIds.indexOf(quizId) !== -1;
            };

            $scope.getQuizScore = function (quizId) {
                if (!$scope.progressData || !$scope.progressData.quizScores) return null;
                for (var i = 0; i < $scope.progressData.quizScores.length; i++) {
                    if ($scope.progressData.quizScores[i].quiz === quizId) {
                        return $scope.progressData.quizScores[i];
                    }
                }
                return null;
            };

            $scope.startQuiz = function (quiz) {
                if ($scope.isQuizAttempted(quiz._id)) return;
                $scope.selectedQuiz = quiz;
                $scope.answers = new Array(quiz.questions.length).fill(-1);
                $scope.timeLeft = quiz.timer * 60;
                $scope.quizStarted = true;
                $scope.quizSubmitted = false;
                $scope.result = null;
                startTimer();
            };

            function startTimer() {
                if ($scope.timerInterval) $interval.cancel($scope.timerInterval);
                $scope.timerInterval = $interval(function () {
                    $scope.timeLeft--;
                    if ($scope.timeLeft <= 0) {
                        $interval.cancel($scope.timerInterval);
                        $scope.submitQuiz(true); // Auto-submit
                    }
                }, 1000);
            }

            $scope.formatTime = function (seconds) {
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            };

            $scope.selectAnswer = function (qIndex, optIndex) {
                if ($scope.quizSubmitted) return;
                $scope.answers[qIndex] = optIndex;
            };

            $scope.getAnsweredCount = function () {
                if (!$scope.answers) return 0;
                var count = 0;
                for (var i = 0; i < $scope.answers.length; i++) {
                    if ($scope.answers[i] >= 0) count++;
                }
                return count;
            };

            $scope.submitQuiz = function (autoSubmit) {
                if ($scope.quizSubmitted) return;
                // Submit directly without popup

                if ($scope.timerInterval) $interval.cancel($scope.timerInterval);
                $scope.quizSubmitted = true;

                QuizService.submitQuiz({
                    quizId: $scope.selectedQuiz._id,
                    courseId: $scope.courseId,
                    answers: $scope.answers
                }).then(r => {
                    $scope.result = r.data;
                }).catch(e => {
                    $scope.result = { error: 'Submission failed. Please contact your teacher.' };
                });
            };

            $scope.getAnswerClass = function (qIndex, optIndex) {
                if (!$scope.quizSubmitted || !$scope.result) {
                    return $scope.answers[qIndex] === optIndex ? 'selected-answer' : '';
                }
                const correctAns = $scope.result.correctAnswers[qIndex];
                if (optIndex === correctAns) return 'correct-answer';
                if (optIndex === $scope.answers[qIndex] && optIndex !== correctAns) return 'wrong-answer';
                return '';
            };

            $scope.$on('$destroy', function () {
                if ($scope.timerInterval) $interval.cancel($scope.timerInterval);
            });
        }]);
