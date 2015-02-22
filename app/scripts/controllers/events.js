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
        url: 'http://130.211.149.155:8080/1/projects/114116/overview/events?developerToken=Rp2JIVtvaCYes3C280bXFIc4eBWkCa7Z1SOS20Df'
    };
});
