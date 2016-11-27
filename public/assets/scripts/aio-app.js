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
  .run(['$rootScope', '$state', function($rootScope, $state) {

    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params, {location: 'replace'});
      }
    });

  }])

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
  ;

angular
  .module('aio.routes',[])
  .config(function($locationProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'core/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    function getSection(module, filename){
      return prefix + module + '/sections/' + filename + '.html';
    }
    function getBlock(module, filename){
      return prefix + module + '/blocks/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('login', {
          url:'/login',
          views: {
            '': {
              templateUrl: getTemplate('auth', 'login'),
            },
            'navbar@dashboard': {
              templateUrl: getSection('homepage', 'navbar'),
            },
          }
        })
        .state('registration', {
          url:'/registration',
          views: {
            '': {
              templateUrl: getTemplate('auth', 'registration'),
            },
            'navbar@dashboard': {
              templateUrl: getSection('homepage', 'navbar'),
            },
          }
        });
  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'core/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    function getSection(module, filename){
      return prefix + module + '/sections/' + filename + '.html';
    }
    function getBlock(module, filename){
      return prefix + module + '/blocks/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
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
            templateUrl: getSection('homepage', 'navbar'),
          },
          'menu-editor@dashboard': {
            templateUrl: getBlock('dashboard', 'menu-editor'),
          },
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('forms', 'general-info.forms'),
            controller: 'mainCtrl'
          },
          'chat@dashboard': {

          }
        }
      });

  });


angular
  .module('aio')
  .controller('mainCtrl', function($scope, FirebaseFactory){
    $scope.general = FirebaseFactory.getObject('general');

    $scope.saveGeneral = function(){
      $scope.general.$save().then(function(){
        console.log('data has been save');
      }).catch(function(error){
        console.log('error saving data');
      });
    };

  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'core/';

    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }

    function getSection(module, filename){
      return prefix + module + '/sections/' + filename + '.html';
    }

    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('homepage', {
        url:'/',
        views: {
          '': {
            templateUrl: getTemplate('homepage', 'homepage'),
          },
          'navbar@homepage': {
            templateUrl: getSection('homepage', 'navbar'),
          },
          'welcome@homepage': {
            templateUrl: getSection('homepage', 'welcome.homepage'),
            controller: 'mainCtrl'
          },
          'intro@homepage': {
            templateUrl: getSection('homepage', 'intro.homepage'),
            controller: 'mainCtrl'
          },
          'specialization@homepage': {
            templateUrl: getSection('homepage', 'specialization.homepage'),
            controller: 'SpecializationCtrl'
          },
          'philosophy@homepage': {
            templateUrl: getSection('homepage', 'philosophy.homepage'),
            controller: 'PhilosophyCtrl'
          },
          'staff@homepage': {
            templateUrl: getSection('homepage', 'staff.homepage'),
            controller: 'StaffCtrl'
          },
          'service@homepage': {
            templateUrl: getSection('homepage', 'service.homepage'),
            controller: 'ServiceCtrl'
          },
          'experience@homepage': {
            templateUrl: getSection('homepage', 'experience.homepage'),
            controller: 'ExperienceCtrl'
          },
          'publication@homepage': {
            templateUrl: getSection('homepage', 'publication.homepage'),
            controller: 'PublicationCtrl'
          },
          'footer@homepage': {
            templateUrl: getSection('homepage', 'footer.homepage'),
            controller: 'mainCtrl'
          }
        }
      });

  });

angular
  .module('aio')
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
  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('experience', {
        parent:'dashboard',
        url:'/experience',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('experience', 'experience.list'),
            controller: 'ExperienceCtrl'
          }
        }
      })
      .state('experience.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTemplate('experience', 'experience.add'),
            controller: 'ExperienceCtrl'
          }
        }
      });

  });

angular
  .module('aio')
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
  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('philosophy', {
        parent:'dashboard',
        url:'/philosophy',
        views: {
          'form-editor@dashboard': {
            abstract:true,
            templateUrl: getTemplate('philosophy', 'philosophy.list'),
            controller: 'PhilosophyCtrl'
          }
        }
      })
      .state('philosophy.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTemplate('philosophy', 'philosophy.add'),
            controller: 'PhilosophyCtrl'
          }
        }
      });

  });

angular
  .module('aio')
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
  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
   var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('publication', {
        parent:'dashboard',
        url:'/publication',
        views: {
          'form-editor@dashboard': {
            abstract:true,
            templateUrl: getTemplate('publication', 'publication.list'),
            controller: 'PublicationCtrl'
          }
        }
      })
      .state('publication.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTemplate('publication', 'publication.add'),
            controller: 'PublicationCtrl'
          }
        }
      });

  });

angular
  .module('aio')
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
  ;

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('service', {
        parent:'dashboard',
        url:'/service',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('service', 'service.list'),
            controller: 'ServiceCtrl'
          }
        }
      })
      .state('service.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTemplate('service', 'service.add'),
            controller: 'ServiceCtrl'
          }
        }
      });

  });

angular
  .module('aio')
  .controller('SpecializationCtrl', function($scope, $state, $stateParams, FirebaseFactory){
    $scope.specializations = FirebaseFactory.getArray('specializations');


    // Add Specialization
    $scope.addSpecialization = function(){
      $scope.specializations.$add({
        name: $scope.specialization.name,
        image: $scope.specialization.image,
        description: $scope.specialization.description,
      }).then(function(){
        $state.go('specialization');
      }).catch(function(error){
        console.log('error saving specialization data');
      });
    };

    // Remove Specialization
    $scope.removeSpecialization = function(item){
      $scope.specializations.$remove(item).then(function(ref){

      });
    };


    // Edit Specialization
    $scope.editSpecialization = function(item){
      var id = $scope.specializations.$keyAt(item);
      item = $scope.specializations.$getRecord(id);

      $state.go('specialization.edit', {id: id});

      console.log(item);

    };

    /*
    *
    * TODO TODO TODO
    * failed toto
     */
    // Update
    $scope.updateSpecialization = function(id) {

      index = $scope.specializations.$indexFor(id) + 1;

      var item = $scope.specializations.$getRecord(id);
      var id = $scope.specializations.$keyAt(item);

      $scope.specializations.$save({
        $id: id,
        name: $scope.specialization.name,
        image: $scope.specialization.image,
        description: $scope.specialization.description
      }).then(function (ref) {
          console.log("Saved !");
      }, function (error) {
          console.log("Error:", error);
      });

    };


  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('specialization', {
        parent:'dashboard',
        url:'/specialization',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.list'),
            controller: 'SpecializationCtrl'
          }
        }
      })
      .state('specialization.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.add'),
            controller: 'SpecializationCtrl',
          }
        }
      })
      .state('specialization.edit', {
        url:'/edit/:id',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.edit'),
            controller: 'SpecializationCtrl'
          }
        }
      });

  });

angular
  .module('aio')
  .controller('StaffCtrl', function($scope, $state, $firebaseObject, $firebaseArray, FirebaseFactory){
    $scope.staffs = FirebaseFactory.getArray('staffs');
    $scope.staffs.specialization = [];
    //console.log($scope.staffs);
    // Add New Staff
    $scope.addStaff = function(item){
      $scope.staffs.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff data');
      });
    };
    $scope.addNewField = function(item){
      $scope.staffs.specialization.push(item);
    };

    // Remove Specialization
    $scope.removeStaff = function(item){
      $scope.staffs.$remove(item).then(function(ref){

      });
    };

    $scope.saveStaff = function(){
      $scope.staffs.$save().then(function(){
        console.log('data staff has been save');
      }).catch(function(error){
        console.log('error saving staff data');
      });
    };

  });

angular
  .module('aio.routes')
  .config(function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('staff', {
        parent:'dashboard',
        url:'/staff',
        views: {
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getTemplate('staff', 'staff.list'),
            controller: 'StaffCtrl'
          }
        }
      })
      .state('staff.add', {
        url:'/add',
        views: {
          'form-editor@dashboard': {
            templateUrl: getTemplate('staff', 'staff.add'),
            controller: 'StaffCtrl'
          }
        }
      });
  });
