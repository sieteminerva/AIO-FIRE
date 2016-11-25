angular
  .module('aio', [
    // frameworks
    'firebase',
    'ui.router',
    'aio.routes'
    // 'angular.filter',
    // 'CaseFilter',
    // 'smoothScroll'
  ])
  .config(function(){
    var config = {
      apiKey: "AIzaSyCIWI62HhipchEs-GNscYBRwDXerrDlZlo",
      authDomain: "aio-ap.firebaseapp.com",
      databaseURL: "https://aio-ap.firebaseio.com",
      storageBucket: "aio-ap.appspot.com",
      messagingSenderId: "606823371400"
    };
    firebase.initializeApp(config);
  })

  .factory('FirebaseFactory', function($firebaseObject, $firebaseArray){
    var data = {};

    var rootRef = firebase.database().ref();
    var ref = rootRef.child('en-US');

    data.getObject = function get(url) {
      return $firebaseObject(ref.child(url));
    };
    data.getArray = function get(url) {
      return $firebaseArray(ref.child(url));
    };

    return data;
  })

  .controller('mainCtrl', function($scope, FirebaseFactory){
    $scope.data = FirebaseFactory.getObject('general');
    console.log($scope.data);
  })
  .controller('SpecializationCtrl', function($scope, FirebaseFactory){
    $scope.fields = FirebaseFactory.getArray('fields');
    console.log($scope.fields);
  })
  ;

"use strict";
angular
  .module('aio.routes',[])
  .config(function($locationProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  })
  .config(function($provide) {
    $provide.decorator('$state', function($delegate, $stateParams) {
      $delegate.forceReload = function() {
        return $delegate.go($delegate.current, $stateParams, {
          reload: true,
          inherit: false,
          notify: true
        });
      };
      return $delegate;
    });
  })
  .config(function($stateProvider, $urlRouterProvider) {

    var moduleName = 'app/';

    function getView(view) {
      return moduleName + view + '.html';
    }

    function getComponent(view) {
      return moduleName + 'components/' + view + '.html';
    }

    function getSection(view) {
      return moduleName + 'sections/' + view + '.html';
    }

    function getBlock(view) {
      return moduleName + 'blocks/' + view + '.html';
    }

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('homepage', {
        url:'/',
        views: {
          '': {
            templateUrl: getView('homepage'),
          },
          'navbar@homepage': {
            templateUrl: getComponent('navbar'),
          },
          // 'user-menu@homepage': {
          //   templateUrl: getView('user-menu'),
          // },
          // 'welcome@homepage': {
          //   templateUrl: getView('welcome')
          // },
          // 'about@homepage': {
          //   templateUrl: getView('about')
          // },
          // 'services@homepage': {
          //   templateUrl: getView('services')
          // },
          // 'portfolio@homepage': {
          //   templateUrl: getView('portfolio')
          // },
          // 'contact@homepage': {
          //   templateUrl: getView('contact')
          // },
          // 'footer@homepage': {
          //   templateUrl: getView('footer')
          // }
        }
      })
      .state('dashboard', {
        url:'/dashboard',
        views: {
          '': {
            templateUrl: getView('dashboard'),
            controller: 'mainCtrl'
          },
          'navbar@dashboard': {
            templateUrl: getComponent('navbar'),
          },
          // 'user-menu@homepage': {
          //   templateUrl: getView('user-menu'),
          // },
          // 'welcome@homepage': {
          //   templateUrl: getView('welcome')
          // },
          // 'about@homepage': {
          //   templateUrl: getView('about')
          // },
          // 'services@homepage': {
          //   templateUrl: getView('services')
          // },
          // 'portfolio@homepage': {
          //   templateUrl: getView('portfolio')
          // },
          // 'contact@homepage': {
          //   templateUrl: getView('contact')
          // },
          // 'footer@homepage': {
          //   templateUrl: getView('footer')
          // }
        }
      })
      .state('login', {
        url:'/login',
        views: {
          '': {
            templateUrl: getView('login'),
          },
          'navbar@dashboard': {
            templateUrl: getComponent('navbar'),
          },
        }
      })
      .state('registration', {
        url:'/registration',
        views: {
          '': {
            templateUrl: getView('registration'),
          },
          'navbar@dashboard': {
            templateUrl: getComponent('navbar'),
          },
        }
      });
    });
