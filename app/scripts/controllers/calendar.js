'use strict';

angular.module('diddleplanService', [])
  .factory('TaskData', function($http) {

    var urlBase = '/api';
    var taskDataFunctions = {};

    taskDataFunctions.getTasks = function() {
      return $http.get(urlBase + '/tasks');
    };

    taskDataFunctions.addTask = function(task) {
      return $http.post(urlBase + '/tasks', task);
    };

    taskDataFunctions.updateTask = function(task) {
      return $http.put(urlBase + '/tasks/' + task.taskID, task);
    };

    taskDataFunctions.formatTime = function(time) {
      var result, m;
      var re = /^\s*([01]?\d|2[0-3]):?([0-5]\d)?\s*$/;

      if ((m = time.match(re))) {
        result = (m[1].length === 2 ? "" : "0") + m[1] + ":" + (m[2] || "00");
      }

      return result;
    };

    return taskDataFunctions;
  });

/**
 * @ngdoc function
 * @name diddleplanApp.controller:CalendarCtrl
 * @description
 * # CalendarCtrl
 * Controller of the diddleplanApp
 */
angular.module('diddleplanApp')
  .controller('CalendarCtrl', function ($scope, tasks, TaskData) {

    $scope.tasks = tasks.data;
    $scope.types = ['todo', 'exercise', 'meal', 'shopping'];

    $scope.removeTask = function(task) {
      for (var i = 0; i < $scope.tasks.length; ++i) {
        if ($scope.tasks[i].name === task.name && $scope.tasks[i].date === task.date) {
          $scope.tasks.splice(i, 1);
          break;
        }
      }
    };

    // create some dates
    $scope.calendar = [];
    $scope.today = Date.now();
    var oneDay = 86400000;
    for (var i = -9; i < 12; ++i) {
      $scope.calendar.push(Date.now() + oneDay * i);
    }

    $scope.loadMoreDays = function() {
      var last = $scope.calendar[$scope.calendar.length - 1];
      for (var i = 1; i <=9; ++i) {
        $scope.calendar.push(last + (oneDay * i));
      }
    };

    $scope.addTask = function(type, date) {
      // TODO: Need to pass in or work these out
      var newTaskData = {
        "name": "",
        "taskType": type,
        "date": date,
        "moveable": true,
        "autoMoveable": null,
        "UserId": 1
      };

      TaskData.addTask(newTaskData)
        .success(function(response) {
          $scope.tasks.push(response);
        })
        .error(function(response) {
          console.log(response);
        });
    };

    $scope.updateTask = function(task) {
      if (task.time === null || TaskData.formatTime(task.time) !== undefined) {
        TaskData.updateTask(task).error(function(response) {
          console.log(response);
        });
      }
    };

    var shoppingItem = {
      name: 'Shopping',
      type: 'shopping'
    };

    $scope.calculateShoppingTrip = function() {
      var remainingMeals = $scope.meals.length;
      for (var i = 0; i < remainingMeals; ++i) {
        var items = $scope.calendar[i].items;
        console.log(items);

        for (var j = 0; j < items; ++j) {
          if (items[j].taskType === 'meal') {
            remainingMeals++;
          }
        }
      }

      $scope.calendar[remainingMeals].items.push(shoppingItem);
    };

    // $scope.calculateShoppingTrip();

    $scope.isTodo = function(value) {
      return (value.taskType === 'todo') && !value.date;
    };

    $scope.isExercise = function(value) {
      return (value.taskType === 'exercise') && !value.date;
    };

    $scope.isMeal = function(value) {
      return (value.taskType === 'meal') && !value.date;
    };

    $scope.isShopping = function(value) {
      return (value.taskType === 'shopping') && !value.date;
    };

    $scope.hasDate = function(value, date) {
      return value && value.date === date;
    };

  });

angular.module('diddleplanApp')
  .directive('scrollIf', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        var cond = scope.$eval(attrs.scrollIf);
        if (cond) {
          $timeout(function() {
            angular.element('.fixed-content').duScrollTo(0, elem[0].offsetTop - 15);
          });
        }
      }
    };
  });

angular.module('diddleplanApp')
  .directive('infiniteScroll', function($rootScope, $timeout) {
    return {
      link: function(scope, elem, attrs) {
        var checkWhenEnabled, handler, scrollDistance, scrollEnabled;

        var $child = angular.element(attrs.infiniteScrollElem);

        scrollDistance = 0;
        if (attrs.infiniteScrollDistance != null) {
          scope.$watch(attrs.infiniteScrollDistance, function(value) {
            return scrollDistance = parseInt(value, 10);
          });
        }
        scrollEnabled = true;
        checkWhenEnabled = false;
        handler = function() {
          var elementBottom, remaining, shouldScroll, windowBottom;

          windowBottom = $child[0].scrollHeight - ($child.scrollTop() + $child.height());
          shouldScroll = windowBottom < scrollDistance;

          if (shouldScroll && scrollEnabled) {
            if ($rootScope.$$phase) {
              return scope.$eval(attrs.infiniteScroll);
            } else {
              return scope.$apply(attrs.infiniteScroll);
            }
          } else if (shouldScroll) {
            return checkWhenEnabled = true;
          }
        };

        $child.on('scroll', handler);

        scope.$on('$destroy', function() {
          return $window.off('scroll', handler);
        });
        return $timeout((function() {
          if (attrs.infiniteScrollImmediateCheck) {
            if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
              return handler();
            }
          } else {
            return handler();
          }
        }), 0);
      }
    };
  }
);
