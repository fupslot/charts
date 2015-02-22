(function (angular, Highcharts) {
    'use strict';

    /**
     * @ngdoc function
     * @name chartsApp.directive:cdUsersLiveChart
     * @description
     * Directive name: cd-users-live-chart
     */

    function UsersLiveChartFn ($timeout, $http) {
        var factory = {};

        factory.strict = 'A';
        factory.scope = {
            serviceConfig: '@'
        };
        
        factory.link = function (scope, el, attrs) {
            var control = null;
            var options;
            var timeoutPromise;
            var httpConfig;
            var retries = 0;

            httpConfig = angular.extend({method:'GET'}, scope.$parent.$eval(attrs.cdUsersLiveChart));


            var SERVER_INTERVAL_MS = parseInt(attrs.interval) || 1000;
            var SERVER_NUMBER_OF_RETRIES = 10;
            var CHART_TITLE = 'Active users';
            var CHART_SERIES_COLOR = 'rgba(47, 177, 204, 0.5)';
            var CHART_POINTS_MAX = 19; // max quantity of points on a chart

            function doShiftChartElements (series) {
                var graph = series.graph;
                var area = series.area;
                var currentShift = (graph && graph.shift) || 0;

                Highcharts.each([graph, area, series.graphNeg, series.areaNeg], function (shape) {
                    if (shape) {
                        shape.shift = currentShift + 1;
                    }
                });
            }

            function addPoint (point, series) {
                if (series.data.length === CHART_POINTS_MAX) {
                    series.data[0].remove(false, false);
                }
                series.addPoint(point);
            }

            function requestData () {
                return $http(httpConfig)
                    .then(function (res) {
                        return res.data;
                    });
            }

            function getDataContinuously(series) {
                function getData () {
                    timeoutPromise = null;
                    requestData().then(function (userNum) {
                        userNum = parseInt(userNum) || 0;
                        // reset number of retries
                        retries = 0;
                        // current time
                        var x = (new Date()).getTime();
                        // number of users
                        var y = userNum;
                        doShiftChartElements(series);
                        addPoint([x, y], series);
                        timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
                    }, function () {
                        if (retries === SERVER_NUMBER_OF_RETRIES) { return; }
                        retries += 1;
                        timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
                        console.error('Chart "%s" has a server issue', CHART_TITLE);
                    });
                }

                timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
            }

            // Chart options
            options = {
                chart: {
                    type: 'line',
                    marginRiht: 10,
                    events: {
                        load: function onLoad () {
                            // set up the updating of the chart each second
                            getDataContinuously(this.series[0]);
                        }
                    }
                },
                plotOptions: {
                    line: {
                        lineWidth: 1
                    },
                    series: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                title: {
                    text: CHART_TITLE
                },
                xAxis: {
                    title: null,
                    type: 'datetime',
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: false,
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                legend: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'Users',
                    color: CHART_SERIES_COLOR,
                    data: []
                }]
            };

            el.highcharts(options);
            control = el.highcharts();

            scope.$on('$destroy', function () {
                if (control) { 
                    control.destroy(); 
                }
                if (timeoutPromise) {
                    $timeout.cancel(timeoutPromise);
                }
            });
        };

        return factory;
    }

    UsersLiveChartFn.$inject = ['$timeout', '$http'];

    angular.module('chartsApp')
    .directive('cdUsersLiveChart', UsersLiveChartFn);
}(window.angular, window.Highcharts));

