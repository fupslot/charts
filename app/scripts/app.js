'use strict';

/**
 * @ngdoc overview
 * @name chartsApp
 * @description
 * # chartsApp
 *
 * Main module of the application.
 */

angular
  .module('chartsApp', [
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/events', {
        templateUrl: 'views/events.html',
        controller: 'EventsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

$(function () {
  var url = 'http://130.211.149.155:8080/1/init?developerToken=Rp2JIVtvaCYes3C280bXFIc4eBWkCa7Z1SOS20Df';
  $.get(url).success(function () {
    angular.bootstrap(document, ['chartsApp']);
  });
})