(function (angular, Highcharts, _) {
    'use strict';

    function ChartTrend (series, trendPointMax) {
        this.name = series.name;
        this._series = series;
        this._emptyPoints = 0;
        this._trendPointMax = trendPointMax;
    }

    ChartTrend.prototype.addPoint = function (x, y) {
        var shift = this._series.data.length === this._trendPointMax;
        this._emptyPoints = (y === null || isNaN(y)) ? (this._emptyPoints + 1) : 0;
        y = parseInt(y) || 0;
        this._series.addPoint([x, y], true, shift);
    };
    
    ChartTrend.prototype.isEmpty = function () {
        return this._emptyPoints >= this._trendPointMax;
    };

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
            var trends = [];

            httpConfig = angular.extend({method:'GET'}, scope.$parent.$eval(attrs.cdEventsLiveChart));


            var SERVER_INTERVAL_MS = parseInt(attrs.interval) || 1000;
            var SERVER_NUMBER_OF_RETRIES = 10;
            var CHART_TITLE = 'Events';
            var CHART_SERIES_COLOR = 'rgba(47, 177, 204, 0.5)';
            var TREND_POINTS_MAX = 19; // max quantity of points on a chart

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

            function getMissingTrendNames (series, data) {
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
                        // Gets list of events which have no trend yet
                        var missingTrendNames = getMissingTrendNames(series, data);
                        var empty = [];
                        // 
                        // doShiftChartElements(series);
                        // Adding new values to existing trends
                        angular.forEach(trends, function (trend) {
                            // Number of events
                            var value = data[trend.name];
                            trend.addPoint(x, value);
                            // Mark trend as a removed if it's empty
                            if (trend.isEmpty()) { empty.push(trend); }
                        });

                        // Creates missing trends
                        angular.forEach(missingTrendNames, function (trendName) {
                            // Adding new triend to a chart
                            var series = control.addSeries({ name: trendName });
                            var trend = new ChartTrend(series, TREND_POINTS_MAX);
                            trend.addPoint(x, parseInt(data[trendName]) || 0);
                            trends.push(trend);
                            // addPoint([x, value], trend);
                        });
                        
                        // Remove empty trends
                        angular.forEach(empty, function (trend) {
                            var idx = trends.indexOf(trend);
                            trends.splice(idx, 1);
                            trend._series.remove();
                            trend = null;
                        });
                        empty.splice(0, empty.length);
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
                        lineWidth: 0
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

