angular
  .module('aio', [
    // frameworks
    'firebase',
    'ui.router',
    'aio.routes',
    'angular.filter',
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
  .run(function($rootScope, $state) {
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireSignIn promise is rejected
      // and redirect the user back to the home page
      if (error === 'AUTH_REQUIRED') {
        $state.go('homepage');
      }
    });
    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params, {location: 'replace'});
      }
    });
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
  .module('aio')
  .controller('MainCtrl', function($scope, AuthFactory, FirebaseFactory){

    $scope.auth = AuthFactory;

    $scope.auth.$onAuthStateChanged(function(aioUser){
      $scope.aioUser = aioUser;
    });

    $scope.general = FirebaseFactory.getObject('general');

    $scope.saveGeneral = function(){
      $scope.general.$save().then(function(){
        console.log('data has been saved');
      }).catch(function(error){
        console.log('error saving data');
      });
    };

  });

angular
  .module('aio')
  .factory('AuthFactory', function(FirebaseFactory, $firebaseAuth){
    var data = {};
    var rootRef = firebase.database().ref();
    data.$firebaseAuth = function(){
      return $firebaseAuth();
    };
    return data.$firebaseAuth(rootRef);
  })
  .controller('AuthCtrl', function($scope, $state, AuthFactory){


    $scope.createUser = function(){
      $scope.message = null;
      $scope.error = null;

      // Create New User
      AuthFactory.$createUserWithEmailAndPassword($scope.email, $scope.password)
        .then(function(aioUser){
          $scope.message = "User created with uid: " + aioUser.uid;
          $state.go('login');

        }).catch(function(error){
          $scope.error = error;
        });
    };

    $scope.deleteUser = function(){
      $scope.message = null;
      $scope.error = null;

      // Delete the currently signed-in user
      AuthFactory.$deleteUser().then(function(){
        $scope.message = "User deleted";
      }).catch(function(error){
        $scope.error = error;
      });
    };

    $scope.login = function(){
      $scope.message = null;
      $scope.error = null;

      AuthFactory.$signInWithEmailAndPassword($scope.email, $scope.password).then(function(aioUser){
        $scope.message = 'signed-in as: ' + aioUser.uid;
        $state.go('dashboard');
        console.log(aioUser);
      }).catch(function(error){
        $scope.error = 'Authentication failed: ' + error;
      });
    };

    $scope.logout = function(){
      AuthFactory.$signOut();
      $state.go('homepage');
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
              controller: 'AuthCtrl'
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
              controller: 'AuthCtrl'
            },
            'navbar@dashboard': {
              templateUrl: getSection('homepage', 'navbar'),
            },
          }
        })
        .state('user', {
          url:'/user',
          resolve: {
            // controller will not be loaded until $requireSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ["AuthFactory", function(AuthFactory) {
              // $requireSignIn returns a promise so the resolve waits for it to complete
              // If the promise is rejected, it will throw a $stateChangeError (see above)
              return AuthFactory.$requireSignIn();
            }]
          },
          views: {
            '': {
              templateUrl: getTemplate('auth', 'user'),
              controller: 'AuthCtrl'
            },
            'navbar@dashboard': {
              templateUrl: getSection('homepage', 'navbar'),
            },
          }
        });
  });

angular
  .module('aio')
  .controller('DashboardCtrl', function(AuthFactory, FirebaseFactory){

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
    function getSharedTemplate(template, filename){
      return 'shared/' + template + '/' + filename + '.html';
    }
    function getTemplateComponent(filename){
      return 'shared/components/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('dashboard', {
        url:'/dashboard',
        resolve: {
          // controller will not be loaded until $requireSignIn resolves
          // Auth refers to our $firebaseAuth wrapper in the factory below
          "currentAuth": ["AuthFactory", function(AuthFactory) {
            // $requireSignIn returns a promise so the resolve waits for it to complete
            // If the promise is rejected, it will throw a $stateChangeError (see above)
            return AuthFactory.$requireSignIn();
          }]
        },
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
            controller: 'MainCtrl'
          },
          'navbar@dashboard': {
            templateUrl: getTemplateComponent('main-navigation.menu'),
            controller: 'AuthCtrl'
          },
          'menu-editor@dashboard': {
            templateUrl: getBlock('dashboard', 'menu-editor'),
          },
          'form-editor@dashboard': {
            abstract: true,
            templateUrl: getSharedTemplate('forms', 'general-info.forms'),
            controller: 'MainCtrl'
          },
          'chat@dashboard': {

          }
        },

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

    function getTemplateComponent(filename){
      return 'shared/components/' + filename + '.html';
    }

    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('homepage', {
        url:'/',
        resolve: {
          // controller will not be loaded until $waitForSignIn resolves
          // Auth refers to our $firebaseAuth wrapper in the factory below
          "currentAuth": ["AuthFactory", function(AuthFactory) {
            // $waitForSignIn returns a promise so the resolve waits for it to complete
            return AuthFactory.$waitForSignIn();
          }]
        },
        views: {
          '': {
            templateUrl: getTemplate('homepage', 'homepage'),
            controller: 'MainCtrl',
          },
          'navbar@homepage': {
            templateUrl: getTemplateComponent('main-navigation.menu'),
            controller: 'AuthCtrl'
          },
          'welcome@homepage': {
            templateUrl: getSection('homepage', 'welcome.homepage'),
            controller: 'MainCtrl'
          },
          'intro@homepage': {
            templateUrl: getSection('homepage', 'intro.homepage'),
            controller: 'MainCtrl'
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
            controller: 'MainCtrl'
          }
        }
      });

  });

angular
  .module('aio')
  .controller('ExperienceCtrl', function($scope, $state, FirebaseFactory){
    $scope.experiences = FirebaseFactory.getArray('experiences');

    //console.log($scope.experiences);
    //
    // Add Experience
    $scope.addExperience = function(item){
      $scope.experiences.$add(item).then(function(){
        $state.go('experience');
      }).catch(function(error){
        console.log('error saving experience data');
      });
    };

    // Remove Experience
    $scope.removeExperience = function(item){
      $scope.experiences.$remove(item).then(function(ref){

      });
    };

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
  .controller('PhilosophyCtrl', function($scope, $state, FirebaseFactory){
    $scope.philosophies = FirebaseFactory.getArray('philosophies');

    //console.log($scope.philosophies);
    // Add Philosophy
    $scope.addPhilosophy = function(item){
      $scope.philosophies.$add(item).then(function(){
        $state.go('philosophy');
      }).catch(function(error){
        console.log('error saving philosophy data');
      });
    };

    // Remove Philosophy
    $scope.removePhilosophy = function(item){
      $scope.philosophies.$remove(item).then(function(ref){

      });
    };
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
  .controller('PublicationCtrl', function($scope, $state, FirebaseFactory){
    $scope.publications = FirebaseFactory.getArray('publications');

    //console.log($scope.publications);
    //
    // Add Publication
    $scope.addPublication = function(item){
      $scope.publications.$add(item).then(function(){
        $state.go('publication');
      }).catch(function(error){
        console.log('error saving publication data');
      });
    };

    // Remove Publication
    $scope.removePublication = function(item){
      $scope.publications.$remove(item).then(function(ref){

      });
    };
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
  .controller('ServiceCtrl', function($scope, $state, FirebaseFactory){
    $scope.services = FirebaseFactory.getArray('services');

    //console.log($scope.services);

    // Add New Staff
    $scope.addService = function(item){
      $scope.services.$add(item).then(function(){
        $state.go('service');
      }).catch(function(error){
        console.log('error saving service data');
      });
    };

    // Remove Service
    $scope.removeService = function(item){
      $scope.services.$remove(item).then(function(ref){

      });
    };

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
  .controller('SpecializationCtrl', function($scope, $state, $firebaseObject, $firebaseArray, $stateParams, FirebaseFactory){
    $scope.specializations = FirebaseFactory.getArray('specializations');


    var rootRef = firebase.database().ref();
    var base = rootRef.child('en-US');
    var specializationRef = base.child('specializations');



    // Add Specialization
    $scope.addSpecialization = function(item){
      $scope.specializations.$add(item).then(function(){
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

      var ref = specializationRef.child(id);
      var data = $firebaseObject(ref);

      data.$bindTo($scope, "currentObj");

      data.$loaded().then(function(obj) {
        console.log(id);
        console.log(obj === data); // true

        angular.forEach($scope.currentObj, function(value, key) {
          console.log(key, value);
        });

        console.log($scope.currentObj);



        $state.go('specialization.edit', {id: id});

      })
      .catch(function(error) {
        console.error("Error:", error);
      });

    };

    /*
    * index = $scope.specializations.$indexFor(id) + 1;
      var item = $scope.specializations.$getRecord(id);
      var id = $scope.specializations.$keyAt(item);
    * TODO TODO TODO
    * failed toto
     */
    // Update
    $scope.updateSpecialization = function(item) {

      var id = $scope.specializations.$keyAt(item);
      var ref = specializationRef.child(id);
      var data = $firebaseObject(ref);

      data.$bindTo($scope, "currentObj");

      data.$save(item).then(function (ref) {
        console.log("Saved !");
        $state.go('specialization');
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
  .controller('StaffDynamicCtrl', function($scope, $state, StaffFactory){

    //var id = $scope.specializations.$keyAt(item)
    //var index = $scope.specializations.$indexFor(id) + 1;

    var ref = firebase.database().ref().child('en-US').child('staffs');
    var educationRef = ref.child('educations');


    $scope.staffs = StaffFactory(ref);
    $scope.staff = {};
    $scope.staff.educations = [];
    $scope.staff.specializations = [];
    $scope.staff.experiences = [];
    $scope.staff.affiliations = [];
    $scope.staff.languages = [];
    $scope.staff.socmeds = [];


    $scope.addStaff = function(item){
      $scope.staffs.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff data');
      });
    };

    $scope.addEducation = function(item){
      $scope.staff.educations.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff education data');
      });
    };

    $scope.addNewEducationField = function(){
      $scope.staff.educations.push({});
      console.log($scope.staff.educations);
    };
    $scope.deleteEducationField = function (index){
      $scope.staff.educations.splice(index, 1);
      console.log($scope.staff.educations);
    };


    $scope.addNewSpecializationField = function(){
      $scope.staff.specializations.push({});
      console.log($scope.staff.specializations);
    };
    $scope.deleteSpecializationField = function (index){
      $scope.staff.specializations.splice(index, 1);
      console.log($scope.staff.specializations);
    };


    $scope.addNewExperienceField = function(){
      $scope.staff.experiences.push({});
      console.log($scope.staff.experiences);
    };
    $scope.deleteExperienceField = function (index){
      $scope.staff.experiences.splice(index, 1);
      console.log($scope.staff.experiences);
    };



    $scope.addNewAffiliationField = function(){
      $scope.staff.affiliations.push({});
      console.log($scope.staff.affiliations);
    };
    $scope.deleteAffiliationField = function (index){
      $scope.staff.affiliations.splice(index, 1);
      console.log($scope.staff.affiliations);
    };


    $scope.addNewLanguageField = function(){
      $scope.staff.languages.push({});
      console.log($scope.staff.languages);
    };
    $scope.deleteLanguageField = function (index){
      $scope.staff.languages.splice(index, 1);
      console.log($scope.staff.languages);
    };


    $scope.addNewSocmedField = function(){
      $scope.staff.socmeds.push({});
      console.log($scope.staff.socmeds);
    };
    $scope.deleteSocmedField = function (index){
      $scope.staff.socmeds.splice(index, 1);
      console.log($scope.staff.socmeds);
    };


    // Add New Staff
    function initFields(){

      $scope.addNewSpecializationField();
      $scope.addNewExperienceField();
      $scope.addNewEducationField();
      $scope.addNewAffiliationField();
      $scope.addNewLanguageField();
      $scope.addNewSocmedField();
    }
    initFields();

    // Remove Specialization
    $scope.removeStaff = function(item){
      $scope.staffs.$remove(item).then(function(ref){

      });
    };




    //console.log($scope.staffs);

  });

angular
  .module('aio')
  .controller('StaffCtrl', function($scope, $state, $firebaseObject, $firebaseArray, FirebaseFactory){
    $scope.staffs = FirebaseFactory.getArray('staffs');
    specializationRef = firebase.database().ref().child('en-US').child('staffs').child('specialization');
    //console.log($scope.staffs);
    // Add New Staff
    $scope.addStaff = function(item){
      $scope.staffs.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff data');
      });
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
  .module('aio')
  .factory('StaffFactory', function($firebaseObject, $firebaseArray, FirebaseFactory){
    return $firebaseArray.$extend({

    });

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

angular
  .module('aio')
  .controller('StaffDynamicCtrl', function($scope, $state, StaffDynamicFactory){

    //var id = $scope.specializations.$keyAt(item)
    //var index = $scope.specializations.$indexFor(id) + 1;

    var ref = firebase.database().ref().child('en-US').child('staffs');
    var educationRef = ref.child('educations');


    $scope.staffs = StaffDynamicFactory(ref);
    $scope.staff = {};
    $scope.staff.educations = [];
    $scope.staff.specializations = [];
    $scope.staff.experiences = [];
    $scope.staff.affiliations = [];
    $scope.staff.languages = [];
    $scope.staff.socmeds = [];


    $scope.addStaff = function(item){
      $scope.staffs.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff data');
      });
    };

    $scope.addEducation = function(item){
      $scope.staff.educations.$add(item).then(function(){
        $state.go('staff');
      }).catch(function(error){
        console.log('error saving staff education data');
      });
    };

    $scope.addNewEducationField = function(){
      $scope.staff.educations.push({});
      console.log($scope.staff.educations);
    };
    $scope.deleteEducationField = function (index){
      $scope.staff.educations.splice(index, 1);
      console.log($scope.staff.educations);
    };


    $scope.addNewSpecializationField = function(){
      $scope.staff.specializations.push({});
      console.log($scope.staff.specializations);
    };
    $scope.deleteSpecializationField = function (index){
      $scope.staff.specializations.splice(index, 1);
      console.log($scope.staff.specializations);
    };


    $scope.addNewExperienceField = function(){
      $scope.staff.experiences.push({});
      console.log($scope.staff.experiences);
    };
    $scope.deleteExperienceField = function (index){
      $scope.staff.experiences.splice(index, 1);
      console.log($scope.staff.experiences);
    };



    $scope.addNewAffiliationField = function(){
      $scope.staff.affiliations.push({});
      console.log($scope.staff.affiliations);
    };
    $scope.deleteAffiliationField = function (index){
      $scope.staff.affiliations.splice(index, 1);
      console.log($scope.staff.affiliations);
    };


    $scope.addNewLanguageField = function(){
      $scope.staff.languages.push({});
      console.log($scope.staff.languages);
    };
    $scope.deleteLanguageField = function (index){
      $scope.staff.languages.splice(index, 1);
      console.log($scope.staff.languages);
    };


    $scope.addNewSocmedField = function(){
      $scope.staff.socmeds.push({});
      console.log($scope.staff.socmeds);
    };
    $scope.deleteSocmedField = function (index){
      $scope.staff.socmeds.splice(index, 1);
      console.log($scope.staff.socmeds);
    };


    // Add New Staff
    function initFields(){

      $scope.addNewSpecializationField();
      $scope.addNewExperienceField();
      $scope.addNewEducationField();
      $scope.addNewAffiliationField();
      $scope.addNewLanguageField();
      $scope.addNewSocmedField();
    }
    initFields();

    // Remove Specialization
    $scope.removeStaff = function(item){
      $scope.staffs.$remove(item).then(function(ref){

      });
    };




    //console.log($scope.staffs);

  });

angular
  .module('aio')
  .factory('StaffDynamicFactory', function($firebaseObject, $firebaseArray, FirebaseFactory){
    return $firebaseArray.$extend({

    });

  });
