angular.module('lmsApp')
    .controller('TeacherCourseController', ['$scope', 'CourseService', 'AuthService',
        function ($scope, CourseService, AuthService) {
            $scope.courses = [];
            $scope.showForm = false;
            $scope.editMode = false;
            $scope.formData = {};
            $scope.selectedCourse = null;
            $scope.assignmentForm = {};
            $scope.message = '';
            $scope.errorMsg = '';
            $scope.uploading = false;

            function loadCourses() {
                CourseService.getTeacherCourses().then(r => { $scope.courses = r.data; });
            }
            loadCourses();

            $scope.openAddForm = function () {
                $scope.formData = {};
                $scope.editMode = false;
                $scope.showForm = true;
                $scope.message = '';
            };

            $scope.openEditForm = function (course) {
                $scope.formData = angular.copy(course);
                $scope.editMode = true;
                $scope.showForm = true;
            };

            $scope.cancelForm = function () { $scope.showForm = false; };

            $scope.saveCourse = function () {
                if ($scope.editMode) {
                    CourseService.updateCourse($scope.formData._id, $scope.formData).then(r => {
                        $scope.message = 'Course updated!';
                        $scope.showForm = false;
                        loadCourses();
                    }).catch(e => { $scope.errorMsg = e.data ? e.data.message : 'Error'; });
                } else {
                    CourseService.createCourse($scope.formData).then(r => {
                        $scope.message = 'Course created!';
                        $scope.showForm = false;
                        loadCourses();
                    }).catch(e => { $scope.errorMsg = e.data ? e.data.message : 'Error'; });
                }
            };

            $scope.deleteCourse = function (id) {
                if (!confirm('Delete this course?')) return;
                CourseService.deleteCourse(id).then(() => { loadCourses(); });
            };

            $scope.selectCourse = function (course) {
                $scope.selectedCourse = course;
                $scope.message = '';
            };

            $scope.uploadVideo = function (courseId) {
                var fileInput = document.getElementById('videoInput_' + courseId);
                if (!fileInput || !fileInput.files[0]) { $scope.errorMsg = 'Select a video file first'; return; }
                var fd = new FormData();
                fd.append('video', fileInput.files[0]);
                fd.append('title', fileInput.files[0].name);
                $scope.uploading = true;

                // Try to get duration from the file before uploading
                var videoEl = document.createElement('video');
                videoEl.preload = 'metadata';
                videoEl.onloadedmetadata = function () {
                    window.URL.revokeObjectURL(videoEl.src);
                    var dur = Math.round(videoEl.duration) || 0;
                    fd.append('duration', dur);
                    CourseService.uploadVideo(courseId, fd).then(function (r) {
                        $scope.message = 'Video uploaded!';
                        loadCourses();
                    }).catch(function () { $scope.errorMsg = 'Upload failed'; }).finally(function () { $scope.uploading = false; });
                };
                videoEl.onerror = function () {
                    // If we can't read metadata, upload without duration
                    fd.append('duration', 0);
                    CourseService.uploadVideo(courseId, fd).then(function (r) {
                        $scope.message = 'Video uploaded!';
                        loadCourses();
                    }).catch(function () { $scope.errorMsg = 'Upload failed'; }).finally(function () { $scope.uploading = false; });
                };
                videoEl.src = URL.createObjectURL(fileInput.files[0]);
            };

            $scope.deleteVideo = function (courseId, videoId) {
                if (!confirm('Remove this video?')) return;
                CourseService.deleteVideo(courseId, videoId).then(function () {
                    $scope.message = 'Video removed!';
                    loadCourses();
                });
            };

            $scope.uploadPdf = function (courseId) {
                var fileInput = document.getElementById('pdfInput_' + courseId);
                if (!fileInput || !fileInput.files[0]) { $scope.errorMsg = 'Select a PDF file first'; return; }
                var fd = new FormData();
                fd.append('pdf', fileInput.files[0]);
                $scope.uploading = true;
                CourseService.uploadPdf(courseId, fd).then(r => {
                    $scope.message = 'PDF uploaded!';
                    loadCourses();
                }).catch(e => { $scope.errorMsg = 'Upload failed'; }).finally(() => { $scope.uploading = false; });
            };

            $scope.addAssignment = function (courseId) {
                if (!$scope.assignmentForm.title) return;
                CourseService.addAssignment(courseId, $scope.assignmentForm).then(r => {
                    $scope.message = 'Assignment added!';
                    $scope.assignmentForm = {};
                    loadCourses();
                });
            };

            $scope.deleteAssignment = function (courseId, assignId) {
                CourseService.deleteAssignment(courseId, assignId).then(() => { loadCourses(); });
            };

            $scope.formatDuration = function (seconds) {
                if (!seconds) return '';
                var m = Math.floor(seconds / 60);
                var s = seconds % 60;
                return m + 'm ' + s + 's';
            };
        }]);
