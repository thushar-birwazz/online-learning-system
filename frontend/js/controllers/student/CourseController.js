angular.module('lmsApp')
    .controller('StudentCourseController', ['$scope', 'CourseService',
        function ($scope, CourseService) {
            $scope.courses = [];
            $scope.loading = true;
            $scope.message = '';
            $scope.errorMsg = '';
            $scope.searchText = '';

            CourseService.getAllCourses().then(r => {
                $scope.courses = r.data;
                $scope.loading = false;
            }).catch(() => { $scope.loading = false; });

            $scope.enroll = function (course) {
                CourseService.enroll(course._id).then(r => {
                    course.isEnrolled = true;
                    $scope.message = 'Successfully enrolled in ' + course.title + '!';
                }).catch(e => {
                    $scope.errorMsg = e.data ? e.data.message : 'Enrollment failed';
                });
            };
        }]);
