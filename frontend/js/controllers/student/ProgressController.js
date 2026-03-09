angular.module('lmsApp')
    .controller('StudentProgressController', ['$scope', 'CourseService',
        function ($scope, CourseService) {
            $scope.progressList = [];
            $scope.loading = true;

            CourseService.getAllProgress().then(r => {
                $scope.progressList = r.data;
                $scope.loading = false;
            }).catch(() => { $scope.loading = false; });

            $scope.getOverallAvg = function () {
                if (!$scope.progressList.length) return 0;
                return Math.round($scope.progressList.reduce((s, p) => s + (p.percentage || 0), 0) / $scope.progressList.length);
            };

            $scope.getQuizAvg = function (scores) {
                if (!scores || !scores.length) return null;
                return Math.round(scores.reduce((s, q) => s + q.percentage, 0) / scores.length);
            };

            $scope.formatTime = function (seconds) {
                if (!seconds || seconds <= 0) return '0:00';
                var m = Math.floor(seconds / 60);
                var s = Math.round(seconds % 60);
                return m + ':' + (s < 10 ? '0' : '') + s;
            };
        }]);
