(function (angular, Highcharts, _) {
    'use strict';

    /**
     * @ngdoc function
     * @name chartsApp.directive:cdEventsLiveChart
     * @description
     * Directive name: cd-users-live-chart
     */

    function EventsLiveChartFn ($timeout, $http) {
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

            httpConfig = angular.extend({method:'GET'}, scope.$parent.$eval(attrs.cdEventsLiveChart));


            var SERVER_INTERVAL_MS = parseInt(attrs.interval) || 1000;
            var SERVER_NUMBER_OF_RETRIES = 10;
            var CHART_TITLE = 'Events';
            var CHART_SERIES_COLOR = 'rgba(47, 177, 204, 0.5)';
            var CHART_POINTS_MAX = 19; // max quantity of points on a chart

            function doShiftChartElements (series) {
                angular.forEach(series, function (trend) {
                    var graph = trend.graph;
                    var area;// = trend.area;
                    var currentShift = (graph && graph.shift) || 0;

                    Highcharts.each([graph, area, trend.graphNeg, trend.areaNeg], function (shape) {
                        if (shape) {
                            shape.shift = currentShift + 1;
                        }
                    });
                });
            }

            function addPoint (point, series) {
                if (series.data.length === CHART_POINTS_MAX) {
                    series.data[0].remove(false, false);
                }
                series.addPoint(point);
            }

            function getMissingTrends (series, data) {
                var a = _.keys(data);
                var b = _.pluck(series, 'name');
                return _.difference(a, b);
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
                    requestData().then(function (data) {
                        // Reset number of retries
                        retries = 0;
                        // Detect new trends
                        var x = (new Date()).getTime();
                        var missingTrends = getMissingTrends(series, data);
                        var empty = [];
                        // 
                        doShiftChartElements(series);
                        // Adding new values to existing trends
                        angular.forEach(series, function (trend) {
                            // Number of events
                            var value = data[trend.name];
                            if (_.isUndefined(value)) { 
                                // If trend has no data remove it
                                if (trend.data.length === 0 ) { empty.push(trend); }
                                return;
                            }
                            // Current time
                            addPoint([x, value], trend);
                        });

                        // Remove empty trends
                        angular.forEach(empty, function (trend) { trend.remove(); });

                        angular.forEach(missingTrends, function (trendName) {
                            // Adding new triend to a chart
                            var trend = control.addSeries({ name: trendName });
                            var value = parseInt(data[trendName]) || 0;
                            addPoint([x, value], trend);
                        });
                        // userNum = parseInt(userNum) || 0;
                        // // reset number of retries
                        // retries = 0;
                        // doShiftChartElements(series);
                        // addPoint([x, y], series);
                        timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
                    }, function () {
                        if (retries === SERVER_NUMBER_OF_RETRIES) { return; }
                        retries += 1;
                        timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
                        console.error('server issue');
                    });
                }

                timeoutPromise = $timeout(getData, SERVER_INTERVAL_MS);
            }

            // Chart options
            options = {
                chart: {
                    type: 'area',
                    marginRiht: 10,
                    events: {
                        load: function onLoad () {
                            // set up the updating of the chart each second
                            getDataContinuously(this.series);
                        }
                    }
                },
                plotOptions: {
                    area: {
                        animation:false,
                        stacking: 'normal',
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

    EventsLiveChartFn.$inject = ['$timeout', '$http'];

    angular.module('chartsApp')
    .directive('cdEventsLiveChart', EventsLiveChartFn);
}(window.angular, window.Highcharts, window._));

