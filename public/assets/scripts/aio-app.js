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
    data.getNestedArray = function get(url, id) {
      return $firebaseArray(ref.child(url).child(id));
    };

    return data;
  })

  .controller('mainCtrl', function($scope, FirebaseFactory){
    $scope.general = FirebaseFactory.getObject('general');

    $scope.saveGeneral = function(){
      $scope.general.$save().then(function(){
        console.log('data has been save');
      }).catch(function(error){
        console.log('error saving data');
      });
    };

  })
  .controller('SpecializationCtrl', function($scope, FirebaseFactory){
    $scope.specializations = FirebaseFactory.getArray('specializations');

    $scope.saveSpecialization = function(){
      $scope.specialization.$save().then(function(){
        console.log('data specialization has been save');
      }).catch(function(error){
        console.log('error saving specialization data');
      });
    };

  })
  .controller('StaffCtrl', function($scope, FirebaseFactory){
    $scope.staffs = FirebaseFactory.getArray('staffs');

    console.log($scope.staffs);
    $scope.saveStaff = function(){
      $scope.staffs.$save().then(function(){
        console.log('data staff has been save');
      }).catch(function(error){
        console.log('error saving staff data');
      });
    };
  })
  .controller('ServiceCtrl', function($scope, FirebaseFactory){
    $scope.services = FirebaseFactory.getArray('services');

    console.log($scope.services);
    $scope.saveService = function(){
      $scope.services.$save().then(function(){
        console.log('data service has been save');
      }).catch(function(error){
        console.log('error saving service data');
      });
    };
  })
  .controller('ExperienceCtrl', function($scope, FirebaseFactory){
    $scope.experiences = FirebaseFactory.getArray('experiences');

    console.log($scope.experiences);
    $scope.saveExperience = function(){
      $scope.experiences.$save().then(function(){
        console.log('data experience has been save');
      }).catch(function(error){
        console.log('error saving experience data');
      });
    };
  })
  .controller('PhilosophyCtrl', function($scope, FirebaseFactory){
    $scope.philosophies = FirebaseFactory.getArray('philosophies');

    console.log($scope.philosophies);
    $scope.savePhilosophy = function(){
      $scope.philosophies.$save().then(function(){
        console.log('data philosophy has been save');
      }).catch(function(error){
        console.log('error saving philosophy data');
      });
    };
  })
  .controller('PublicationCtrl', function($scope, FirebaseFactory){
    $scope.publications = FirebaseFactory.getArray('publications');

    console.log($scope.publications);
    $scope.savePublication = function(){
      $scope.publications.$save().then(function(){
        console.log('data publication has been save');
      }).catch(function(error){
        console.log('error saving publication data');
      });
    };
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

    function getForm(view) {
      return moduleName + 'forms/' + view + '.html';
    }

    function getTable(view) {
      return moduleName + 'tables/' + view + '.html';
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
            template:
              '<div ui-view="navbar"></div>'+
              '<div class="ui padded grid fullscreen dashboard">'+
                '<div class="three column row">'+
                  '<div class="teal three wide column">'+
                    '<div ui-view="menu-editor"></div>'+
                  '</div>'+
                  '<div class="green eight wide column editor">'+
                    '<div ui-view="form-editor"></div>'+
                  '</div>'+
                  '<div class="olive five wide column"></div>'+
                '</div>'+
              '</div>',
            controller: 'mainCtrl'
          },
          'navbar@dashboard': {
            templateUrl: getComponent('navbar'),
          },
          'menu-editor@dashboard': {
            templateUrl: getComponent('menu-editor'),
          },
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getForm('general-info.forms'),
            controller: 'mainCtrl'
          },
          'chat@dashboard': {

          }
        }
      })
      .state('staff', {
        parent:'dashboard',
        url:'/staff',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('staffs-list'),
            controller: 'StaffCtrl'
          }
        }
      })
      .state('experience', {
        parent:'dashboard',
        url:'/experience',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('experiences-list'),
            controller: 'ExperienceCtrl'
          }
        }
      })
      .state('service', {
        parent:'dashboard',
        url:'/service',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('services-list'),
            controller: 'ServiceCtrl'
          }
        }
      })
      .state('philosophy', {
        parent:'dashboard',
        url:'/philosophy',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('philosophies-list'),
            controller: 'PhilosophyCtrl'
          }
        }
      })
      .state('specialization', {
        parent:'dashboard',
        url:'/specialization',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('specializations-list'),
            controller: 'SpecializationCtrl'
          }
        }
      })
      .state('publication', {
        parent:'dashboard',
        url:'/publication',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTable('publications-list'),
            controller: 'PublicationCtrl'
          }
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
