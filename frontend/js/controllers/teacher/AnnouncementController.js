angular.module('lmsApp')
    .controller('TeacherAnnouncementController', ['$scope', 'NotificationService', 'CourseService',
        function ($scope, NotificationService, CourseService) {
            $scope.announcements = [];
            $scope.courses = [];
            $scope.formData = { title: '', body: '', courseId: '' };
            $scope.showForm = false;
            $scope.message = '';
            $scope.errorMsg = '';

            function loadData() {
                NotificationService.getTeacherAnnouncements().then(r => { $scope.announcements = r.data; });
                CourseService.getTeacherCourses().then(r => { $scope.courses = r.data; });
            }
            loadData();

            $scope.post = function () {
                if (!$scope.formData.title || !$scope.formData.body) {
                    $scope.errorMsg = 'Title and message are required';
                    return;
                }
                NotificationService.createAnnouncement($scope.formData).then(r => {
                    $scope.message = 'Announcement posted and students notified!';
                    $scope.formData = { title: '', body: '', courseId: '' };
                    $scope.showForm = false;
                    loadData();
                }).catch(e => { $scope.errorMsg = e.data ? e.data.message : 'Error'; });
            };
        }]);
