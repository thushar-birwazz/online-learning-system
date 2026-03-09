angular.module('lmsApp')
    .controller('StudentLessonController', ['$scope', '$routeParams', '$interval', 'CourseService',
        function ($scope, $routeParams, $interval, CourseService) {
            $scope.courseId = $routeParams.courseId;
            $scope.course = null;
            $scope.progress = null;
            $scope.currentVideo = null;
            $scope.message = '';
            $scope.loading = true;
            var saveInterval = null;

            function loadCourse() {
                CourseService.getMyCourses().then(function (r) {
                    $scope.course = r.data.find(function (c) { return c._id === $scope.courseId; });
                    if (!$scope.course) {
                        CourseService.getAllCourses().then(function (r2) {
                            $scope.course = r2.data.find(function (c) { return c._id === $scope.courseId; });
                            if ($scope.course && $scope.course.videos && $scope.course.videos.length) {
                                $scope.currentVideo = $scope.course.videos[0];
                            }
                        });
                    } else if ($scope.course.videos && $scope.course.videos.length) {
                        $scope.currentVideo = $scope.course.videos[0];
                    }
                    $scope.loading = false;
                });
            }

            function loadProgress() {
                CourseService.getCourseProgress($scope.courseId).then(function (r) {
                    $scope.progress = r.data;
                });
            }

            loadCourse();
            loadProgress();

            $scope.playVideo = function (video) {
                // Save current video progress before switching
                saveCurrentVideoTime();
                $scope.currentVideo = video;
                // Wait for ng-src to update, then set up tracking
                setTimeout(function () { setupVideoTracking(); }, 200);
            };

            function setupVideoTracking() {
                var videoEl = document.getElementById('lessonVideo');
                if (!videoEl) return;

                // Clear any existing interval
                if (saveInterval) $interval.cancel(saveInterval);

                // Save progress every 10 seconds while playing
                saveInterval = $interval(function () {
                    saveCurrentVideoTime();
                }, 10000);
            }

            function saveCurrentVideoTime() {
                if (!$scope.currentVideo) return;
                var videoEl = document.getElementById('lessonVideo');
                if (!videoEl || !videoEl.currentTime) return;

                var watchedSeconds = Math.round(videoEl.currentTime);
                var duration = Math.round(videoEl.duration) || $scope.currentVideo.duration || 0;

                if (watchedSeconds > 0) {
                    CourseService.updateVideoTime(
                        $scope.courseId,
                        $scope.currentVideo._id,
                        watchedSeconds,
                        duration
                    ).then(function (r) {
                        $scope.progress = r.data;
                    });
                }
            }

            // Set up tracking when the first video loads
            setTimeout(function () { setupVideoTracking(); }, 1000);

            $scope.getVideoWatched = function (videoId) {
                if (!$scope.progress || !$scope.progress.videoProgress) return 0;
                for (var i = 0; i < $scope.progress.videoProgress.length; i++) {
                    if ($scope.progress.videoProgress[i].videoId === videoId) {
                        return $scope.progress.videoProgress[i].watchedSeconds;
                    }
                }
                return 0;
            };

            $scope.isVideoCompleted = function (videoId) {
                if (!$scope.progress || !$scope.progress.videoProgress) return false;
                for (var i = 0; i < $scope.progress.videoProgress.length; i++) {
                    if ($scope.progress.videoProgress[i].videoId === videoId) {
                        return $scope.progress.videoProgress[i].completed;
                    }
                }
                return false;
            };

            $scope.formatTime = function (seconds) {
                if (!seconds || seconds <= 0) return '0:00';
                var m = Math.floor(seconds / 60);
                var s = Math.round(seconds % 60);
                return m + ':' + (s < 10 ? '0' : '') + s;
            };

            $scope.markAssignmentDone = function (assignmentId) {
                if ($scope.progress && $scope.progress.assignmentsCompleted &&
                    $scope.progress.assignmentsCompleted.indexOf(assignmentId) !== -1) return;
                CourseService.markAssignmentDone($scope.courseId, assignmentId).then(function (r) {
                    $scope.progress = r.data;
                    $scope.message = '✅ Assignment marked as complete!';
                });
            };

            $scope.isAssignmentDone = function (assignmentId) {
                return $scope.progress && $scope.progress.assignmentsCompleted &&
                    $scope.progress.assignmentsCompleted.indexOf(assignmentId) !== -1;
            };

            $scope.$on('$destroy', function () {
                // Save progress before leaving
                saveCurrentVideoTime();
                if (saveInterval) $interval.cancel(saveInterval);
            });
        }]);
