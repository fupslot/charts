'use strict';

/**
 * @ngdoc function
 * @name chartsApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the chartsApp
 */
angular.module('chartsApp')
  .controller('EventsCtrl', function ($scope) {
    $scope.config = {
        url: 'http://localhost:3000/data/events'
    };
});
