/**
 * Created by kells4 on 2/11/2015.
 */
app.directive('sessionForm',function() {
    return {
        restrict: 'EA',
        scope: true,
        replace: true,
        transclude: false,
        templateUrl: 'views/admin/directives/partials/SessionForm.html'
    };
});