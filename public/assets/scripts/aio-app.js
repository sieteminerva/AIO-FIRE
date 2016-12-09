angular
  .module('aio', [
    // frameworks
    'ngAnimate',
    'ngSanitize',
    'firebase',
    'ui.router',
    'angular.filter',
    'semantic-ui',
    'vTabs',
    'angular-svg-round-progressbar',
    // 'CaseFilter',
    // 'smoothScroll'
    // Internal modules
    'aio.routes',
    // Internal Directives
    'aio.readmore',
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
  .config(['$provide', function($provide) {
    $provide.decorator('$state', ['$delegate', '$stateParams', function($delegate, $stateParams) {
      $delegate.forceReload = function() {
        return $delegate.go($delegate.current, $stateParams, {
          reload: true,
          inherit: false,
          notify: true
        });
      };
      return $delegate;
    }]);
  }])
  .run(['$rootScope', '$state', function($rootScope, $state) {
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
  }])
  .factory('FirebaseFactory', ['$firebaseObject', '$firebaseArray', function($firebaseObject, $firebaseArray){
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
  }])
  ;

angular
  .module('aio.routes',[])
  .config(['$locationProvider', '$urlRouterProvider', function($locationProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  }]);

angular
  .module('aio')
  .controller('MainCtrl', ['$scope', 'AuthFactory', 'FirebaseFactory', function($scope, AuthFactory, FirebaseFactory){


    $scope.auth = AuthFactory;

    $scope.auth.$onAuthStateChanged(function(aioUser){
      $scope.aioUser = aioUser;
    });
    $scope.generalTabs = {
      active: 0
    };

    $scope.general = FirebaseFactory.getObject('general');

    $scope.saveGeneral = function(){
      $scope.general.$save().then(function(){
        console.log('data has been saved');
      }).catch(function(error){
        console.log('error saving data');
      });
    };

  }]);


angular
  .module('aio')
  .factory('AuthFactory', ['FirebaseFactory', '$firebaseAuth', function(FirebaseFactory, $firebaseAuth){
    var data = {};
    var rootRef = firebase.database().ref();
    data.$firebaseAuth = function(){
      return $firebaseAuth();
    };
    return data.$firebaseAuth(rootRef);
  }])
  .controller('AuthCtrl', ['$scope', '$state', '$stateParams', 'AuthFactory', 'currentAuth', 'UserFactory', function($scope, $state, $stateParams, AuthFactory, currentAuth, UserFactory){
    $scope.sendEmailVerification = function(){
      currentAuth.sendEmailVerification().then(function(){
        console.log('verification sent!');
        $state.go('verification');
      }).catch(function(error){
        console.log(error);
      });
    };

    $scope.verifiedAccount = function(){
      firebase.auth()
        .applyActionCode($stateParams.oobCode).then(function(data){
          console.log(currentAuth.uid);
        }).catch(function(error){
          console.log(error);
        });
    };

    $scope.createUser = function(){
      $scope.message = null;
      $scope.error = null;

      // Create New User
      AuthFactory.$createUserWithEmailAndPassword($scope.email, $scope.password)
        .then(function(aioUser){

          $scope.message = "You have been created your user account, but only one more step to get going ";

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

    $scope.localeData = {
      'en-US': {
        flagClass: 'us flag',
        langDisplayText: 'ENG'
      },
      'id-ID': {
        flagClass: 'id flag',
        langDisplayText: 'IND'
      }
    };

  }]);



angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
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
          resolve: {
            currentAuth:['AuthFactory', function(AuthFactory) {
              return AuthFactory.$waitForSignIn();
            }]
          },
          views: {
            '': {
              templateUrl: getTemplate('auth', 'login'),
              controller: 'AuthCtrl'
            },
          }
        })
        .state('registration', {
          url:'/registration',
          resolve: {
            currentAuth:['AuthFactory', function(AuthFactory) {
              return AuthFactory.$waitForSignIn();
            }]
          },
          views: {
            '': {
              templateUrl: getTemplate('auth', 'registration'),
              controller: 'AuthCtrl'
            },
          }
        })
        .state('verification', {
          url:'/verification?mode&oobCode',
          controller: 'AuthCtrl',
          resolve: {
            currentAuth:['AuthFactory', function(AuthFactory) {
              return AuthFactory.$requireSignIn();
            }]
          },
          views: {
            '': {
              templateUrl: getTemplate('auth', 'verification'),
              controller: 'AuthCtrl'
            },
          }
        })
        .state('user', {
          url:'/user',
          resolve: {
            // controller will not be loaded until $requireSignIn resolves
            // Auth refers to our $firebaseAuth wrapper in the factory below
            "currentAuth": ['AuthFactory', function(AuthFactory) {
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
          }
        });
  }]);

angular
  .module('aio')
  .factory('UserFactory', ['FirebaseFactory', 'AuthFactory', '$firebaseAuth', function(FirebaseFactory, AuthFactory, $firebaseAuth){
      var data = {};

      return data;
  }])
  .controller('UserCtrl', ['$scope', '$state', 'UserFactory', 'AuthFactory', function($scope, $state, UserFactory, AuthFactory){

  }]);


angular
  .module('aio')
  .controller('DashboardCtrl', ['AuthFactory', 'FirebaseFactory', function(AuthFactory, FirebaseFactory){

  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
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
          "currentAuth": ['AuthFactory', function(AuthFactory) {
            // $requireSignIn returns a promise so the resolve waits for it to complete
            // If the promise is rejected, it will throw a $stateChangeError (see above)
            return AuthFactory.$requireSignIn();
          }]
        },
        views: {
          '': {
            templateUrl: getTemplate('dashboard', 'dashboard'),
              /*'<div ui-view="navbar"></div>'+
              '<div class="ui padded grid fullscreen dashboard">'+
                '<div class="row">'+


                '</div>'+
                '<div class="three column row">'+
                  '<div class="teal three wide column">'+
                    '<div ui-view="menu-editor"></div>'+
                  '</div>'+
                  '<div class="green eight wide column editor">'+
                    '<div ui-view="form-editor"></div>'+
                  '</div>'+
                  '<div class="olive five wide column"></div>'+
                '</div>'+
              '</div>'*/
            controller: 'MainCtrl'
          },
          'main-navigation@dashboard': {
            templateUrl: getTemplateComponent('main-navigation.menu'),
            controller: 'AuthCtrl'
          },
          'heading@dashboard': {
            templateUrl: getBlock('dashboard', 'heading.menu'),
            controller: 'DashboardCtrl'
          },
          'block-left@dashboard': {
            abstract: true,
            template: '<h2 class="ui inverted header">Block Left</h1>',
            controller: 'DashboardCtrl'
          },
          'block-right@dashboard': {
            abstract: true,
            redirectTo: 'general',
            template: '<h2 class="ui inverted header">Block Right</h1>',
            controller: 'DashboardCtrl'
          },
        },

      });

  }]);


angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
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

    function getSharedTemplate(filename){
      return 'shared/blocks/' + filename + '.html';
    }

    function getModuleTemplate(module, filename){
      return 'modules/aio-site/' + module + '/' + filename + '.html';
    }

    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('homepage', {
        url:'/',
        resolve: {
          // controller will not be loaded until $waitForSignIn resolves
          // Auth refers to our $firebaseAuth wrapper in the factory below
          currentAuth: ['AuthFactory', function(AuthFactory) {
            // $waitForSignIn returns a promise so the resolve waits for it to complete
            return AuthFactory.$waitForSignIn();
          }],
          loadStaff: ['FirebaseFactory', function(FirebaseFactory){
            return FirebaseFactory.getArray('staffs');
          }]
        },
        views: {
          '': {
            templateUrl: getTemplate('homepage', 'homepage'),
            controller: 'MainCtrl'
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
            templateUrl: getModuleTemplate('specialization', 'specialization.homepage'),
            controller: 'SpecializationCtrl'
          },
          'philosophy@homepage': {
            templateUrl: getModuleTemplate('philosophy', 'philosophy.homepage'),
            controller: 'PhilosophyCtrl'
          },
          'staff@homepage': {
            templateUrl: getModuleTemplate('staff', 'staff.homepage'),
            controller: 'StaffCtrl'
          },
          'service@homepage': {
            templateUrl: getModuleTemplate('service', 'service.homepage'),
            controller: 'ServiceCtrl'
          },
          'company-profile@homepage': {
            templateUrl: getSharedTemplate('company-profile.block'),
            controller: 'MainCtrl'
          },
          'experience@homepage': {
            templateUrl: getModuleTemplate('experience', 'experience.homepage'),
            controller: 'ExperienceCtrl'
          },
          'publication@homepage': {
            templateUrl: getModuleTemplate('publication', 'publication.homepage'),
            controller: 'PublicationCtrl'
          },
          'footer@homepage': {
            templateUrl: getSection('homepage', 'footer.homepage'),
            controller: 'MainCtrl'
          },
          'dev-footer@homepage': {
            templateUrl: getSharedTemplate('dev-footer.block')
          }
        }
      });

  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('general', {
        parent:'dashboard',
        url:'/general-info',
        views: {
          'block-right@dashboard': {
            abstract: true,
            templateUrl: getTemplate('aio-site', 'general'),
            controller: 'MainCtrl'
          },
          'module-menu@general': {
            templateUrl: getTemplate('aio-site', 'menu.module')
          },
          'module-block@general': {
            abstract:true,
            templateUrl: getTemplate('aio-site', 'general.list')
          }
        }
      })
      .state('general.edit', {
        url:'/edit',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('aio-site', 'general.edit'),
            controller: 'MainCtrl'
          }
        }
      });

  }]);

angular.module('aio')
    .factory('AioWriterFactory', ['facebookFactory', 'vimeoFactory', 'tumblrFactory', 'flickrFactory', 'rssFactory', 'youtubeFactory', 'wikipediaFactory', function(facebookFactory, vimeoFactory, tumblrFactory, flickrFactory, rssFactory, youtubeFactory, wikipediaFactory){
      data = {};

      return data;
    }])
    // controller
    .controller('AioEditorCtrl', ['$scope', 'facebookFactory', 'vimeoFactory', 'tumblrFactory', 'flickrFactory', 'rssFactory', 'youtubeFactory', 'wikipediaFactory', 'AioWriterFactory', function($scope, facebookFactory, vimeoFactory, tumblrFactory, flickrFactory, rssFactory, youtubeFactory, wikipediaFactory, AioWriterFactory){



    }]);

angular.module('aio')
    .factory('AioWriterFactory', ['itunesFactory', 'facebookFactory', 'vimeoFactory', 'tumblrFactory', 'flickrFactory', 'rssFactory', 'youtubeFactory', 'wikipediaFactory', function(itunesFactory, facebookFactory, vimeoFactory, tumblrFactory, flickrFactory, rssFactory, youtubeFactory, wikipediaFactory){
      data = {};

      return data;
    }])
    // controller
    .controller('AioFeedCtrl', ['$scope', 'itunesFactory', 'facebookFactory', 'vimeoFactory', 'tumblrFactory', 'flickrFactory', 'rssFactory', 'youtubeFactory', 'wikipediaFactory', 'AioWriterFactory', function($scope, itunesFactory, facebookFactory, vimeoFactory, tumblrFactory, flickrFactory, rssFactory, youtubeFactory, wikipediaFactory, AioWriterFactory){
      $scope.keyword = 'hope';
      $scope.limit = 10;
      $scope.lang = 'en';
      $scope.rssUrl = 'http://rss.detik.com/index.php/hot';
      $scope.articles = [];
      $scope.images = [];
      $scope.videos = [];
      $scope.rssFeeds = [];
      $scope.vimeoVids = [];
      $scope.feedTabs = {
        active: 0
      };
      $scope.musics = [];

      $scope.updateArtist = function(){
        itunesFactory.setArtist($scope.keyword);
      };
      $scope.getItunesMusic = function(){
        $scope.updateArtist();
        itunesFactory.callItunes()
        .then(function(_data){
          $scope.musics = _data.results;
          //console.log($scope.musics);
        }).catch(function(error) {
          console.error('could not retrieved data from itunes', error);
        });
      };

      $scope.getWikipediaArticle = function(){
        wikipediaFactory.searchArticles({
          term: $scope.keyword,
          lang: $scope.lang,
          gsrlimit: $scope.limit,
        }).then(function(_data) {
        //on success
        $scope.articles = _data.data.query.pages;
        //console.log($scope.articles);
        }).catch(function(error) {
          console.error('could not retrieved data');
        });
      };

      $scope.getFlickrImage = function(){
        flickrFactory.getImagesByTags({
          tags: $scope.keyword,
        }).then(function(_data){
          $scope.images = _data.data.items;
          //console.log($scope.images);
        }).catch(function (error) {
           console.error('could not retrieved images');
        });

      };

      $scope.getVideos = function(){
        youtubeFactory.getVideosFromSearchByParams({
            q: $scope.keyword,
            maxResults: $scope.limit,
        }).then(function (_data) {
            $scope.videos = _data.data.items;
            //console.log($scope.videos);
        }).catch(function (error) {
            console.error('could not retrieved Youtube Videos');
        });

        vimeoFactory.getVideosFromTag({
            tag:$scope.keyword,
            per_page:$scope.limit,
        }).then(function(_data){
            $scope.vimeoVids = _data.data.data;
            //console.log($scope.vimeoVids);
        }).catch(function (_data) {
            console.error('could not retrieved Vimeo Videos');
        });

      };
      $scope.rssUrls = [
        'http://rss.detik.com/index.php/hot'
      ];
      $scope.rssUrl = $scope.rssUrls[0];

      $scope.addNewRss = function(item){
        $scope.rssUrls.push(item);
        $scope.loadRssFeed(item);
      };

      $scope.removeRss = function(index){
        $scope.rssUrls.splice(index, 1);
      };

      $scope.loadRssFeed = function(item){
        rssFactory.getFeed(item).then(function(_data){
          $scope.rssFeeds = _data.data.responseData.feed.entries;
        }).catch(function(error){
          console.error('could not retrieved rss feed');
        });
      };


      $scope.searchFeed = function(){
        $scope.getWikipediaArticle();
        $scope.getFlickrImage();
        $scope.getItunesMusic();
        $scope.getVideos();
        $scope.loadRssFeed($scope.rssUrls);
      };
       $scope.loadRssFeed($scope.rssUrls);
    }]);

angular
  .module('aio')
  // routes
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('aio-writer', {
        parent:'dashboard',
        url:'/aio-writer',
        views: {
          'block-right@dashboard': {
            abstract: true,
            templateUrl: getTemplate('aio-writer', 'aio-feed'),
            controller: 'AioFeedCtrl'
          },
          'block-left@dashboard': {
            abstract: true,
            templateUrl: getTemplate('aio-writer', 'aio-editor'),
            controller: 'AioEditorCtrl'
          }
        }
      })
      ;
  }]);

angular.module('aio')
  .directive('aioCarousel', function() {
    return {
      restrict: 'E',
      transclude: false,
      link: function (scope) {
        scope.initCarousel = function(element) {
          // provide any default options you want
          var defaultOptions = {};
          var customOptions = scope.$eval($(element).attr('carousel-options'));
          // combine the two options objects
          for(var key in customOptions) {
            defaultOptions[key] = customOptions[key];
          }
          // init carousel
          $(element).owlCarousel(defaultOptions);
        };
      }
    };
  })
  .directive('aioCarouselItem', function() {
    return {
      restrict: 'A',
      transclude: false,
      link: function(scope, element) {
        // wait for the last item in the ng-repeat then call init
        if(scope.$last) {
          scope.initCarousel(element.parent());
        }
      }
    };
  });

'use strict';


readMore.$inject = ['$templateCache'];
angular
  .module('aio.readmore', ['ngAnimate', 'ngSanitize'])
  .directive('aioReadMore', readMore)
  .config(['$logProvider', function ($logProvider) {
    $logProvider.debugEnabled(false);
  }]);

/** @ngInject */
function readMore($templateCache) {
  aioReadMoreController.$inject = ['$filter', '$scope', '$log'];
  var directive = {
    restrict: 'AE',
    scope: {
      aioText: '@',
      aioLimit: '@',
      aioMoreText: '@',
      aioLessText: '@',
      aioDotsClass: '@',
      aioLinkClass: '@'
    },
    template: $templateCache.get('readmore.template.html'),
    controller: aioReadMoreController,
    controllerAs: 'vm',
    bindToController: true
  };

  return directive;

  /** @ngInject */
  // "bindToController: true" binds scope variables to Controller
  function aioReadMoreController($filter, $scope, $log) {
    var vm = this;
    vm.toggle = {
      dots: '...',
      dotsClass: vm.aioDotsClass,
      linkClass: vm.aioLinkClass
    }

    // Toggle functions
    function setToggleMoreText() {
      $log.debug('setToggleMoreText');
      vm.toggle.moreText = vm.aioMoreText || 'Read more';
    }

    function setToggleLessText() {
      $log.debug('setToggleLessText');
      vm.toggle.lessText = vm.aioLessText || 'Read less';
    }

    function setCurrentToggleText() {
      $log.debug('setCurrentToggleText');
      vm.toggle.text = vm.toggle.state ? vm.toggle.lessText : vm.toggle.moreText;
    }

    function setShowToggle() {
      $log.debug('setShowToggle');
      vm.toggle.show = vm.moreText && vm.moreText.length > 0;
    }

    vm.doToggle = function () {
      $log.debug('doToggle');
      vm.toggle.state = !vm.toggle.state;
      vm.showMoreText = !vm.showMoreText;
      setCurrentToggleText();
    }

    $scope.$watch('vm.aioMoreText', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioMoreText changed');
        setToggleMoreText();
        setCurrentToggleText();
      }
    });

    $scope.$watch('vm.aioLessText', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioLessText changed');
        setToggleLessText();
        setCurrentToggleText();
      }
    });

    $scope.$watch('vm.aioDotsClass', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioDotsClass changed');
        vm.toggle.dotsClass = vm.aioDotsClass;
      }
    });

    $scope.$watch('vm.aioLinkClass', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioLinkClass changed');
        vm.toggle.linkClass = vm.aioLinkClass;
      }
    });

    // ----------

    // If negative number, set to undefined
    function validateLimit() {
      $log.debug('validateLimit');
      vm.aioLimit = (vm.aioLimit && vm.aioLimit <= 0) ? undefined : vm.aioLimit;
    }

    function getMoreTextLimit() {
      $log.debug('getMoreTextLimit');
      return vm.aioLimit && vm.aioLimit < vm.aioText.length ? vm.aioLimit - vm.aioText.length : 0;
    }

    function setLessAndMoreText() {
      $log.debug('setLessAndMoreText');
      vm.lessText = $filter('limitTo')(vm.aioText, vm.aioLimit);
      vm.moreText = $filter('limitTo')(vm.aioText, getMoreTextLimit());
    }

    function initialize() {
      $log.debug('initialize');
      setToggleMoreText();
      setToggleLessText();
      validateLimit();
      setLessAndMoreText();
      setShowToggle();
      setCurrentToggleText();
    }

    initialize();

    $scope.$watch('vm.aioText', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioText changed');
        validateLimit();
        setLessAndMoreText();
        setShowToggle();
      }
    });

    $scope.$watch('vm.aioLimit', function (newValue, oldValue) {
      if (newValue != oldValue) {
        $log.debug('aioLimit changed');
        validateLimit();
        setLessAndMoreText();
        setShowToggle();
      }
    });
  }
};

angular.module("aio.readmore").run(['$templateCache', function($templateCache) {$templateCache.put("readmore.template.html","<span name=\"text\">\n  <span ng-bind-html=\"vm.lessText\" style=\"white-space:pre-wrap;\"></span>\n  <span ng-show=\"vm.showMoreText\" class=\"more-show-hide\" ng-bind-html=\"vm.moreText\" style=\"white-space:pre-wrap;\"></span>\n</span>\n\n<span name=\"toggle\" ng-show=\"vm.toggle.show\">\n <span ng-class=\"vm.toggle.dotsClass\" ng-show=\"!vm.toggle.state\">{{ vm.toggle.dots }}</span>\n <a ng-class=\"vm.toggle.linkClass\" ng-click=\"vm.doToggle()\">{{ vm.toggle.text }}</a>\n</span>\n");}]);

angular
  .module('aio')
  .filter('findUrl', function(){
    return function(input){
      var imgRegex = /(https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?\.(jpg|png|gif)/g;
      var text = input || '';
      var output = input.match(imgRegex);
      return text.replace(input, output);
    };
  });


angular
  .module('aio')
  .factory('TemplateFactory', function(){
    data = {};



    data.getSubModuleTemplate = function(module, submodule, filename){
      return 'modules/' + module + '/' + submodule + '/' + filename + '.html';
    };


    return data;
  });

angular
  .module('aio')
  .controller('ExperienceCtrl', ['$scope', '$state', 'FirebaseFactory', function($scope, $state, FirebaseFactory){
    $scope.experiences = FirebaseFactory.getArray('experiences');

    //console.log($scope.experiences);
    $scope.experienceTabs = {
      active: 0
    }
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
  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('experience', {
        parent:'general',
        url:'/experience',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('experience', 'experience.list'),
            controller: 'ExperienceCtrl'
          }
        }
      })
      .state('experience.add', {
        url:'/add',
        views: {
          'module-block@general': {
            templateUrl: getTemplate('experience', 'experience.add'),
            controller: 'ExperienceCtrl'
          }
        }
      });

  }]);

angular
  .module('aio')
  .controller('PhilosophyCtrl', ['$scope', '$state', 'FirebaseFactory', function($scope, $state, FirebaseFactory){
    $scope.philosophies = FirebaseFactory.getArray('philosophies');

    $scope.philosophyCarousel = {
      items: 1,
      autoplay: false,
      nav: false,
      dots: true,
      dotContainer: 'dot-holder',
      itemElement: 'div',
      itemClass: 'philosophy carousel',
      dotsClass: 'dot-holder',
      dotClass: 'carousel-dot',
      navContainerClass: 'nav-holder',
      navClass: ['nav-prev', 'nav-next'],
      navText: [ '<i class="chevron circle left arrow icon"></i>', '<i class="chevron circle left right arrow icon"></i>' ],
      loop:false,
    };

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
  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('philosophy', {
        parent:'general',
        url:'/philosophy',
        views: {
          'module-block@general': {
            abstract:true,
            templateUrl: getTemplate('philosophy', 'philosophy.list'),
            controller: 'PhilosophyCtrl'
          }
        }
      })
      .state('philosophy.add', {
        url:'/add',
        views: {
          'module-block@general': {
            templateUrl: getTemplate('philosophy', 'philosophy.add'),
            controller: 'PhilosophyCtrl'
          }
        }
      });

  }]);

angular
  .module('aio')
  .controller('PublicationCtrl', ['$scope', '$state', 'FirebaseFactory', function($scope, $state, FirebaseFactory){
    $scope.publications = FirebaseFactory.getArray('publications');

    //console.log($scope.publications);
    $scope.publicationCarousel = {
      items: 1,
      nav: true,
      center: true,
      itemElement: 'figure',
      itemClass: 'publication carousel',
      navContainerClass: 'nav-holder',
      navClass: ['nav-prev', 'nav-next'],
      navText: [ '<i class="chevron circle left arrow icon"></i>', '<i class="chevron circle left right arrow icon"></i>' ],
      loop:false,
      responsive: {
        480 : {
          items : 1,
        },
        768 : {
          items : 1,
        },
        1024 : {
          items : 1,
        },
        1280 : {
          items : 1,
        }
      }
    };
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
  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
   var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('publication', {
        parent:'general',
        url:'/publication',
        views: {
          'module-block@general': {
            abstract:true,
            templateUrl: getTemplate('publication', 'publication.list'),
            controller: 'PublicationCtrl'
          }
        }
      })
      .state('publication.add', {
        url:'/add',
        views: {
          'module-block@general': {
            templateUrl: getTemplate('publication', 'publication.add'),
            controller: 'PublicationCtrl'
          }
        }
      });

  }]);

angular
  .module('aio')
  .controller('ServiceCtrl', ['$scope', '$state', 'FirebaseFactory', function($scope, $state, FirebaseFactory){
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
  }])
  ;

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('service', {
        parent:'general',
        url:'/service',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('service', 'service.list'),
            controller: 'ServiceCtrl'
          }
        }
      })
      .state('service.add', {
        url:'/add',
        views: {
          'module-block@general': {
            templateUrl: getTemplate('service', 'service.add'),
            controller: 'ServiceCtrl'
          }
        }
      });

  }]);

angular
  .module('aio')
  .controller('SpecializationCtrl', ['$scope', '$state', '$firebaseObject', '$firebaseArray', '$stateParams', 'FirebaseFactory', function($scope, $state, $firebaseObject, $firebaseArray, $stateParams, FirebaseFactory){
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


  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('specialization', {
        parent:'general',
        url:'/specialization',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.list'),
            controller: 'SpecializationCtrl'
          }
        }
      })
      .state('specialization.add', {
        url:'/add',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.add'),
            controller: 'SpecializationCtrl',
          }
        }
      })
      .state('specialization.edit', {
        url:'/edit/:id',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('specialization', 'specialization.edit'),
            controller: 'SpecializationCtrl'
          }
        }
      });

  }]);

angular
  .module('aio')
  .controller('StaffCtrl', ['$scope', '$state', '$firebaseObject', '$firebaseArray', 'FirebaseFactory', function($scope, $state, $firebaseObject, $firebaseArray, FirebaseFactory){
    $scope.staffs = FirebaseFactory.getArray('staffs');
    specializationRef = firebase.database().ref().child('en-US').child('staffs').child('specialization');
    //console.log($scope.staffs);
    // Frontend Settings

    $scope.staffCarousel = {
      autoplay: false,
      nav: true,
      itemElement: 'figure',
      itemClass: 'team carousel',
      navContainerClass: 'nav-holder',
      navClass: ['nav-prev', 'nav-next'],
      navText: [ '<i class="chevron circle left arrow icon"></i>', '<i class="chevron circle left right arrow icon"></i>' ],
      loop:false,
      margin: 20,
      responsive: {
        480 : {
          items : 1,
          center: true,
        },
        768 : {
          items : 2,
        },
        1024 : {
          items : 3,
        },
        1280 : {
          items : 3,
        }
      }
    };

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

  }]);

angular
  .module('aio')
  .factory('StaffFactory', ['$firebaseObject', '$firebaseArray', 'FirebaseFactory', function($firebaseObject, $firebaseArray, FirebaseFactory){
    return $firebaseArray.$extend({

    });

  }]);

angular
  .module('aio.routes')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider){
    var prefix = 'modules/aio-site/';
    function getTemplate(module, filename){
      return prefix + module + '/' + filename + '.html';
    }
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('staff', {
        parent:'general',
        url:'/staff',
        views: {
          'module-block@general': {
            abstract: true,
            templateUrl: getTemplate('staff', 'staff.list'),
            controller: 'StaffCtrl'
          }
        }
      })
      .state('staff.add', {
        url:'/add',
        views: {
          'module-block@general': {
            templateUrl: getTemplate('staff', 'staff.add'),
            controller: 'StaffCtrl'
          }
        }
      });
  }]);

angular
  .module('aio')
  .controller('StaffDynamicCtrl', ['$scope', '$state', 'StaffDynamicFactory', function($scope, $state, StaffDynamicFactory){

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

  }]);

angular
  .module('aio')
  .factory('StaffDynamicFactory', ['$firebaseObject', '$firebaseArray', 'FirebaseFactory', function($firebaseObject, $firebaseArray, FirebaseFactory){
    return $firebaseArray.$extend({

    });

  }]);

angular.module('aio')
    .factory('facebookFactory', ['$http', 'facebookSearchDataService', function ($http, facebookSearchDataService) {

        var facebookFactory = {};

        facebookFactory.getPostsFromPageById = function (_params) {
            var facebookSearchData = facebookSearchDataService.getNew("postsFromPageById", _params);

            return $http({
                method: 'GET',
                url: facebookSearchData.url,
                params: facebookSearchData.object,
            });
        };

        facebookFactory.getPhotosFromPageById = function (_params) {
            var facebookSearchData = facebookSearchDataService.getNew("photosFromPageById", _params);

            return $http({
                method: 'GET',
                url: facebookSearchData.url,
                params: facebookSearchData.object,
            });
        };

        facebookFactory.getVideosFromPageById = function (_params) {
            var facebookSearchData = facebookSearchDataService.getNew("videosFromPageById", _params);

            return $http({
                method: 'GET',
                url: facebookSearchData.url,
                params: facebookSearchData.object,
            });
        };

        facebookFactory.getEventsFromPageById = function (_params) {
            var facebookSearchData = facebookSearchDataService.getNew("eventsFromPageById", _params);

            return $http({
                method: 'GET',
                url: facebookSearchData.url,
                params: facebookSearchData.object,
            });
        };

        facebookFactory.getPageById = function (_params) {
            var facebookSearchData = facebookSearchDataService.getNew("pageById", _params);

            return $http({
                method: 'GET',
                url: facebookSearchData.url,
                params: facebookSearchData.object,
            });
        };

        return facebookFactory;
    }])
    .service('facebookSearchDataService', function () {
        this.getApiBaseUrl = function (_params) {
            var version;

            if(angular.isDefined(_params) && angular.isDefined(_params.version)) {
                version = _params.version+"/";
            } else {
                version = "v2.5/";
            }
            return "https://graph.facebook.com/"+version;
        };

        this.fillDataInObjectByList = function(_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if(angular.isDefined(_params[value])) {
                    _object.object[value] = _params[value];
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {

            var facebookSearchData = {
                object: {
                    //access_token:_params.access_token || undefined,
                    access_token: '520729221459954|9FJUp9BOWPRKQWA3XxNS-3b2aBg' || undefined,
                },
                url: "",
            };

            if (angular.isDefined(_params.limit)) {
                facebookSearchData.object.limit = _params.limit;
            }

            switch (_type) {
                case "postsFromPageById":
                    facebookSearchData.object.fields = "id,message,story,created_time,full_picture,from,link,description,type,shares,source,picture,object_id";

                    facebookSearchData = this.fillDataInObjectByList(facebookSearchData, _params, [
                        '__paging_token', 'until', 'since', '__previous'
                    ]);

                    facebookSearchData.url = this.getApiBaseUrl()+_params.page+"/posts?";
                    break;

                case "photosFromPageById":

                    facebookSearchData.object.fields = "id,created_time,from,link,picture,album,name,images,width,height";

                    facebookSearchData = this.fillDataInObjectByList(facebookSearchData, _params, [
                        'before', 'after'
                    ]);

                    facebookSearchData.url = this.getApiBaseUrl()+_params.page+"/photos?";
                    break;

                case "videosFromPageById":

                    facebookSearchData.object.fields = "id,created_time,from,description,source,picture,format,title,embed_html,permalink_url,length";

                    facebookSearchData = this.fillDataInObjectByList(facebookSearchData, _params, [
                        'before', 'after'
                    ]);

                    facebookSearchData.url = this.getApiBaseUrl()+_params.page+"/videos?";
                    break;

                case "eventsFromPageById":

                    facebookSearchData.object.fields = "id,owner,description,picture{url},end_time,name,cover,category,place,start_time,ticket_uri";

                    facebookSearchData = this.fillDataInObjectByList(facebookSearchData, _params, [
                        'before', 'after'
                    ]);

                    facebookSearchData.url = this.getApiBaseUrl()+_params.page+"/events?";
                    break;

                case "pageById":

                    facebookSearchData.object.fields = "cover,link,picture{url},username,name";

                    facebookSearchData.object.limit = undefined;

                    facebookSearchData.url = this.getApiBaseUrl()+_params.page+"/";
                    break;

            }

            return facebookSearchData;
        };
    });

angular.module('aio')
    .factory('rssFactory', ['$http', function($http) {
      return {
        getFeed: function (url) {
            var prefix = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=JSON_CALLBACK&num=10&q=";
            return $http.jsonp(prefix + encodeURIComponent(url));
        }
      };
    }])
    ;

/**
    @name: angular-flickr-api-factory
    @version: 0.5.1 (21-03-2016)
    @author: Jonathan Hornung
    @url: https://github.com/JohnnyTheTank/angular-flickr-api-factory#readme
    @license: MIT
*/

angular.module("aio")
    .factory('flickrFactory', ['$http', 'flickrSearchDataService', function ($http, flickrSearchDataService) {

        var flickrFactory = {};

        flickrFactory.getImagesFromUserById = function (_params) {

            var searchData = flickrSearchDataService.getNew("imagesFromUserById", _params);

            return $http({
                method: 'JSONP',
                url: searchData.url,
                params: searchData.object,
            });
        };

        flickrFactory.getImagesFromGroupOfUsersByIds = function (_params) {

            var searchData = flickrSearchDataService.getNew("imagesFromGroupOfUsersByIds", _params);

            return $http({
                method: 'JSONP',
                url: searchData.url,
                params: searchData.object,
            });
        };

        flickrFactory.getImagesByTags = function (_params) {

            var searchData = flickrSearchDataService.getNew("imagesByTags", _params);

            return $http({
                method: 'JSONP',
                url: searchData.url,
                params: searchData.object,
            });
        };

        return flickrFactory;
    }])
    .service('flickrSearchDataService', function () {
        this.getApiBaseUrl = function (_params) {
            return "https://api.flickr.com/services/feeds/photos_public.gne";
        };

        this.fillDataInObjectByList = function (_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if (angular.isDefined(_params[value])) {
                    _object.object[value] = _params[value];
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {
            var flickrSearchData = {
                object: {
                    jsoncallback:'JSON_CALLBACK',
                    format: "json"
                },
                url: "",
            };

            switch (_type) {
                case "imagesFromUserById":
                    flickrSearchData = this.fillDataInObjectByList(flickrSearchData, _params, [
                        'lang', 'id'
                    ]);

                    flickrSearchData.url = this.getApiBaseUrl();
                    break;

                case "imagesFromGroupOfUsersByIds":
                    flickrSearchData = this.fillDataInObjectByList(flickrSearchData, _params, [
                        'lang', 'ids'
                    ]);

                    flickrSearchData.url = this.getApiBaseUrl();
                    break;

                case "imagesByTags":
                    flickrSearchData = this.fillDataInObjectByList(flickrSearchData, _params, [
                        'lang', 'tags', 'tagmode'
                    ]);

                    flickrSearchData.url = this.getApiBaseUrl();
                    break;
            }

            return flickrSearchData;
        };
    });

angular.module("aio")
  .factory('itunesFactory', ['$http', '$q', function($http, $q) {

    var itunesFactory = {};
    var baseUrl = 'https://itunes.apple.com/search?term=';
    var _artist = '';
    var _finalUrl = '';

    var makeUrl = function() {
        _artist = _artist.split(' ').join('+');
        _finalUrl = baseUrl + _artist + '&callback=JSON_CALLBACK';
        return _finalUrl;
    };

    itunesFactory.setArtist = function(artist) {
        _artist = artist;
    };

    itunesFactory.getArtist = function() {
        return _artist;
    };

    itunesFactory.callItunes = function() {
        makeUrl();
        var deferred = $q.defer();
        $http({
            method: 'JSONP',
            url: _finalUrl
        }).success(function(data) {
            deferred.resolve(data);
        }).error(function() {
            deferred.reject('There was an error');
        });
        return deferred.promise;
    };



    return itunesFactory;
  }]);

angular.module('aio')
    .factory('tumblrFactory', ['$http', 'tumblrSearchDataService', function ($http, tumblrSearchDataService) {

        var tumblrFactory = {};

        tumblrFactory.getPostsFromPage = function (_params) {
            var tumblrSearchData = tumblrSearchDataService.getNew("postsFromPage", _params);

            return $http.jsonp(
                tumblrSearchData.url,
                {
                    method: 'GET',
                    params: tumblrSearchData.object,
                }
            );
        };

        tumblrFactory.getInfoFromPage = function (_params) {
            var tumblrSearchData = tumblrSearchDataService.getNew("infoFromPage", _params);

            return $http.jsonp(
                tumblrSearchData.url,
                {
                    method: 'GET',
                    params: tumblrSearchData.object,
                }
            );
        };

        tumblrFactory.getAvatarFromPage = function (_params) {
            var tumblrSearchData = tumblrSearchDataService.getNew("avatarFromPage", _params);

            return $http.jsonp(
                tumblrSearchData.url,
                {
                    method: 'GET',
                    params: tumblrSearchData.object,
                }
            );
        };

        return tumblrFactory;
    }])
    .service('tumblrSearchDataService', function () {
        this.getApiBaseUrl = function (_params) {
            var version;

            if(_params && angular.isDefined(_params.version)) {
                version = _params.version+"/";
            } else {
                version = "v2/";
            }
            return 'https://api.tumblr.com/'+version+'blog/';
        };

        this.fillDataInObjectByList = function(_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if(angular.isDefined(_params[value])) {
                    _object.object[value] = _params[value];
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {

            var tumblrSearchData = {
                object: {
                    //api_key:_params.api_key || undefined,
                    api_key: 'nyWopPRHmA7Us2anWzUVuC9EEw0bp7lWfVtMSIHRWaruEoTMOU' || undefined,
                    callback: "JSON_CALLBACK"
                },
                url: "",
            };

            if (angular.isDefined(_params.limit)) {
                tumblrSearchData.object.limit = _params.limit;
            }

            switch (_type) {
                case "postsFromPage":
                    tumblrSearchData = this.fillDataInObjectByList(tumblrSearchData, _params, [
                        'type', 'id', 'tag', 'offset', 'reblog_info', 'notes_info', 'filter'
                    ]);

                    tumblrSearchData.url = this.getApiBaseUrl()+_params.page+".tumblr.com/posts";
                    break;

                case "infoFromPage":
                    tumblrSearchData.object.limit = undefined;

                    tumblrSearchData.url = this.getApiBaseUrl()+_params.page+".tumblr.com/info";
                    break;

                case "avatarFromPage":
                    tumblrSearchData.object.limit = undefined;

                    var size = "";

                    if (angular.isDefined(_params.size)) {
                        size = "/"+_params.size;
                    }

                    tumblrSearchData.url = this.getApiBaseUrl()+_params.page+".tumblr.com/avatar"+size;
                    break;

            }

            return tumblrSearchData;
        };
    });

angular.module('aio')

.factory('twitterFactory', ['$q', '$twitterHelpers', '$http', function($q, $twitterHelpers, $http) {

 /*
  // This should be on controller

  $scope.getTweet = function(){
        var clientId = 'foFrg0n7OKlKcOWnkINaIKa7e';
        var clientSecret = 'T5XfRemtyauxeUReId7sm3rt3WPfJfDOKdl7OZ9N4lZOldmWXA';
        var myToken = {
          "token_type":"bearer",
          "access_token":"AAAAAAAAAAAAAAAAAAAAAFIMwgAAAAAAiDvSvJirOdHaDZKqgHPIkvyHsNw%3DPNQ2VYXzmQtR1kBtlifYXMNxYyiZBZ5IInFtXDvKqxrdN5Ohy2"
        };
        twitterFactory.configure(clientId, clientSecret, myToken);
        twitterFactory.searchTweets($scope.keyword)
        .then(function(_data) {
          $scope.tweets = _data;
          console.log(data);
        }, function(error) {
          console.log('err: ' + error);
        });
  };

  */


  var token;
  var clientId = '';
  var clientSecret = '';

  var HOME_TIMELINE_URL = 'https://api.twitter.com/1.1/statuses/home_timeline.json';
  var SEARCH_TWEETS_URL = 'https://api.twitter.com/1.1/search/tweets.json';
  var STATUS_UPDATE_URL = 'https://api.twitter.com/1.1/statuses/update.json';
  var STATUS_MENTIONS_URL = 'https://api.twitter.com/1.1/statuses/mentions_timeline.json';
  var USER_TIMELINE_URL = 'https://api.twitter.com/1.1/statuses/user_timeline.json';
  var USER_DETAILS_URL = 'https://api.twitter.com/1.1/users/show.json';

  function getRequest(url, neededParams, optionalParams) {
    var deferred = $q.defer();
    if (typeof(optionalParams)==='undefined') optionalParams = {};
    if (typeof(neededParams)==='undefined') neededParams = {};
    var parameters = angular.extend(optionalParams, neededParams);
    $twitterHelpers.createTwitterSignature('GET', url, parameters, clientId, clientSecret, token);

    $http({
        method: 'GET',
        url: url,
        params: parameters
      })
    .success(function(data, status, headers, config) {
      deferred.resolve(data);
    })
    .error(function(data, status, headers, config) {
        if (status === 401) {
          token = null;
        }
        deferred.reject(status);
    });
    return deferred.promise;
  }

  function postRequest(url, neededParams, optionalParams) {
    var deferred = $q.defer();
    if (typeof(optionalParams)==='undefined') optionalParams = {};
    var parameters = angular.extend(optionalParams, neededParams);

    // // Append the bodyparams to the URL
    var t = $twitterHelpers.createTwitterSignature('POST', url, parameters, clientId, clientSecret, token);
    if (parameters !== {}) url = url + '?' + $twitterHelpers.transformRequest(parameters);

    $http.post(url, parameters)
    .success(function(data, status, headers, config) {
      deferred.resolve(data);
    })
    .error(function(data, status, headers, config) {
        if (status === 401) {
          token = null;
        }
        deferred.reject(status);
    });
    return deferred.promise;
  }

  return {
    configure: function(cId, cSecret, authToken) {
      clientId = cId;
      clientSecret = cSecret;
      token = authToken;
    },
    getHomeTimeline: function(parameters) {
      return getRequest(HOME_TIMELINE_URL, parameters);
    },
    getMentionsTimeline: function(parameters) {
      return getRequest(STATUS_MENTIONS_URL, parameters);
    },
    getUserTimeline: function(parameters) {
      return getRequest(USER_TIMELINE_URL, parameters);
    },
    searchTweets: function(keyword, parameters) {
      return getRequest(SEARCH_TWEETS_URL, {q: keyword}, parameters);
    },
    postStatusUpdate: function(statusText, parameters) {
      return postRequest(STATUS_UPDATE_URL, {status: statusText}, parameters);
    },
    getUserDetails: function(user_id, parameters) {
      return getRequest(USER_DETAILS_URL, {user_id: user_id}, parameters);
    },
    getRequest: getRequest,
    postRequest: postRequest
  };
}])

/*
 * AngularJS Twitter REST Api wrapper
 *
 * Created by Simon Reimler
 * http://www.devdactic.com
 *
 *
 *
 * DESCRIPTION:
 *
 * Configure the library with:
 *    - Consumer Key (API Key)
 *    - Consumer Secret (API Secret)
 *    - Valid OAuth Token
 *
 *
 *
 * Wrapped Endpoints:
 *
 *    statuses/home_timeline
 *    statuses/update
 *    search/tweets
 *
 */


.factory('$twitterHelpers', ['$q', '$http', function($q, $http) {

  /* This snippet is copied from Nic Raboy's ngCordovaOauth
  * For more information see: https://github.com/nraboy/ng-cordova-oauth
  * Sign an Oauth 1.0 request
  *
  * Addition From Simon Reimler:
  * Encode Bodyparams with escapeSpecialCharacters(), because Twitter is very strict with OAuth.
  * See: http://stackoverflow.com/questions/14672502/bug-or-spec-change-of-twitter-api-1-1
  *
  * @param    string method
  * @param    string endPoint
  * @param    object headerParameters
  * @param    object bodyParameters
  * @param    string secretKey
  * @param    string tokenSecret (optional)
  * @return   object
  */
  function createSignature(method, endPoint, headerParameters, bodyParameters, secretKey, tokenSecret) {
    if(typeof jsSHA !== "undefined") {
      var headerAndBodyParameters = angular.copy(headerParameters);
      var bodyParameterKeys = Object.keys(bodyParameters);
      for(var i = 0; i < bodyParameterKeys.length; i++) {
        headerAndBodyParameters[bodyParameterKeys[i]] = escapeSpecialCharacters(bodyParameters[bodyParameterKeys[i]]);
      }
      var signatureBaseString = method + "&" + encodeURIComponent(endPoint) + "&";
      var headerAndBodyParameterKeys = (Object.keys(headerAndBodyParameters)).sort();
      for(i = 0; i < headerAndBodyParameterKeys.length; i++) {
        if(i == headerAndBodyParameterKeys.length - 1) {
          signatureBaseString += encodeURIComponent(headerAndBodyParameterKeys[i] + "=" + headerAndBodyParameters[headerAndBodyParameterKeys[i]]);
        } else {
          signatureBaseString += encodeURIComponent(headerAndBodyParameterKeys[i] + "=" + headerAndBodyParameters[headerAndBodyParameterKeys[i]] + "&");
        }
      }
      var oauthSignatureObject = new jsSHA(signatureBaseString, "TEXT");

      var encodedTokenSecret = '';
      if (tokenSecret) {
        encodedTokenSecret = encodeURIComponent(tokenSecret);
      }

      headerParameters.oauth_signature = encodeURIComponent(oauthSignatureObject.getHMAC(encodeURIComponent(secretKey) + "&" + encodedTokenSecret, "TEXT", "SHA-1", "B64"));
      var headerParameterKeys = Object.keys(headerParameters);
      var authorizationHeader = 'OAuth ';
      for(i = 0; i < headerParameterKeys.length; i++) {
        if(i == headerParameterKeys.length - 1) {
          authorizationHeader += headerParameterKeys[i] + '="' + headerParameters[headerParameterKeys[i]] + '"';
        } else {
          authorizationHeader += headerParameterKeys[i] + '="' + headerParameters[headerParameterKeys[i]] + '",';
        }
      }
      return { signature_base_string: signatureBaseString, authorization_header: authorizationHeader, signature: headerParameters.oauth_signature };
    } else {
      return "Missing jsSHA JavaScript library";
    }
  }

  /* This snippet is copied from Nic Raboy's ngCordovaOauth
  * For more information see: https://github.com/nraboy/ng-cordova-oauth
  *
  * Create Random String Nonce
  *
  * @param    integer length
  * @return   string
  */
  function createNonce(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  function escapeSpecialCharacters(string) {
    var tmp = encodeURIComponent(string);
    tmp = tmp.replace(/\!/g, "%21");
    tmp = tmp.replace(/\'/g, "%27");
    tmp = tmp.replace(/\(/g, "%28");
    tmp = tmp.replace(/\)/g, "%29");
    tmp = tmp.replace(/\*/g, "%2A");
    return tmp;
  }

  function transformRequest(obj) {
      var str = [];
      for(var p in obj)
      str.push(encodeURIComponent(p) + "=" + escapeSpecialCharacters(obj[p]));
      console.log(str.join('&'));
      return str.join('&');
  }

  return {
    createTwitterSignature: function(method, url, bodyParameters, clientId, clientSecret, token) {
      var oauthObject = {
        oauth_consumer_key: clientId,
        oauth_nonce: createNonce(10),
        oauth_signature_method: "HMAC-SHA1",
        oauth_token: token.oauth_token,
        oauth_timestamp: Math.round((new Date()).getTime() / 1000.0),
        oauth_version: "1.0"
      };
      var signatureObj = createSignature(method, url, oauthObject, bodyParameters, clientSecret, token.oauth_token_secret);
      $http.defaults.headers.common.Authorization = signatureObj.authorization_header;
      return signatureObj;
    },
    transformRequest: transformRequest
  };
}]);

angular.module('aio')
    .factory('vimeoFactory', ['$http', 'vimeoSearchDataService', function ($http, vimeoSearchDataService) {

        var vimeoFactory = {};

        vimeoFactory.getVideosFromChannel = function (_params) {

            if(!_params.channel) {
                return false;
            }
            var searchData = vimeoSearchDataService.getNew("videosFromChannel", _params);
            return $http({
                    method: 'GET',
                    url: searchData.url,
                    params: searchData.object,
                }
            );
        };

        vimeoFactory.getVideosFromCategory = function (_params) {

            if(!_params.category) {
                return false;
            }
            var searchData = vimeoSearchDataService.getNew("videosFromCategory", _params);
            return $http({
                    method: 'GET',
                    url: searchData.url,
                    params: searchData.object,
                }
            );
        };

        vimeoFactory.getVideosFromTag = function (_params) {

            if(!_params.tag) {
                return false;
            }

            var searchData = vimeoSearchDataService.getNew("videosFromTag", _params);

            return $http({
                    method: 'GET',
                    url: searchData.url,
                    params: searchData.object,
                }
            );
        };

        vimeoFactory.getVideosFromUser = function (_params) {

            if(!_params.user) {
                return false;
            }

            var searchData = vimeoSearchDataService.getNew("videosFromUser", _params);

            return $http({
                    method: 'GET',
                    url: searchData.url,
                    params: searchData.object,
                }
            );
        };

        return vimeoFactory;
    }])
    .service('vimeoSearchDataService', function () {
        this.getApiBaseUrl = function (_params) {
            return "https://api.vimeo.com/";
        };

        this.fillDataInObjectByList = function (_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if (angular.isDefined(_params[value])) {
                    _object.object[value] = _params[value];
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {

            var vimeoSearchData = {
                object: {
                    access_token: '5a9c85e06551282ded8e1f7709d89bf1',
                    //access_token: _params.access_token,
                },
                url: "",
            };

            switch (_type) {
                case "videosFromChannel":
                    vimeoSearchData = this.fillDataInObjectByList(vimeoSearchData, _params, [
                        'page', 'query', 'filter', 'filter_embeddable', 'sort', 'direction', 'per_page'
                    ]);

                    vimeoSearchData.url = this.getApiBaseUrl() + "channels/" + _params.channel + "/videos";
                    break;

                case "videosFromCategory":
                     vimeoSearchData = this.fillDataInObjectByList(vimeoSearchData, _params, [
                        'page', 'query', 'filter', 'filter_embeddable', 'sort', 'direction', 'per_page'
                    ]);

                    vimeoSearchData.url = this.getApiBaseUrl() + "categories/" + _params.category + "/videos";
                    break;

                case "videosFromTag":
                    vimeoSearchData = this.fillDataInObjectByList(vimeoSearchData, _params, [
                        'page', 'query', 'sort', 'direction', 'per_page'
                    ]);

                    vimeoSearchData.url = this.getApiBaseUrl() + "tags/" + _params.tag + "/videos";
                    break;

                case "videosFromUser":
                    vimeoSearchData = this.fillDataInObjectByList(vimeoSearchData, _params, [
                        'page', 'query', 'filter', 'filter_embeddable', 'sort', 'direction', 'per_page'
                    ]);

                    vimeoSearchData.url = this.getApiBaseUrl() + "users/" + _params.user + "/videos";
                    break;
            }

            return vimeoSearchData;
        };
    });

/**
    @name: angular-wikipedia-api-factory
    @version: 0.2.3 (19-06-2016)
    @author: Jonathan Hornung
    @url: https://github.com/JohnnyTheTank/angular-wikipedia-api-factory#readme
    @license: MIT
*/


angular.module("aio")
    .factory('wikipediaFactory', ['$http', 'wikipediaSearchDataService', function ($http, wikipediaSearchDataService) {

        var wikipediaFactory = {};

        wikipediaFactory.searchArticlesByTitle = function (_params) {

            var wikipediaSearchData = wikipediaSearchDataService.getNew("searchArticlesByTitle", _params);

            return $http.jsonp(
                wikipediaSearchData.url,
                {
                    method: 'GET',
                    params: wikipediaSearchData.object,
                }
            );
        };

        wikipediaFactory.searchArticles = function (_params) {

            var wikipediaSearchData = wikipediaSearchDataService.getNew("searchArticles", _params);

            return $http.jsonp(
                wikipediaSearchData.url,
                {
                    method: 'GET',
                    params: wikipediaSearchData.object,
                }
            );
        };

        wikipediaFactory.getArticle = function (_params) {

            var wikipediaSearchData = wikipediaSearchDataService.getNew("getArticle", _params);

            return $http.jsonp(
                wikipediaSearchData.url,
                {
                    method: 'GET',
                    params: wikipediaSearchData.object,
                }
            );
        };

        return wikipediaFactory;
    }])
    .service('wikipediaSearchDataService', function () {
        this.getApiBaseUrl = function (_lang) {
            return 'https://' + _lang + ".wikipedia.org/w/api.php";
        };

        this.fillDataInObjectByList = function (_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if (angular.isDefined(_params[value])) {
                    _object.object[value] = _params[value];
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {

            var wikipediaSearchData = {
                object: {
                    callback: "JSON_CALLBACK",
                    action: 'query',
                    format: 'json',
                    formatversion: 2,
                },
                url: "",
            };

            if (angular.isUndefined(_params.lang)) {
                _params.lang = 'en'
            }

            if (angular.isUndefined(_params.pithumbsize)) {
                _params.pithumbsize = '400'
            }

            switch (_type) {
                case "searchArticlesByTitle":
                    wikipediaSearchData.object.prop = 'extracts|pageimages|info';
                    wikipediaSearchData.object.generator = 'search';
                    wikipediaSearchData.object.gsrsearch = 'intitle:' + _params.term;
                    wikipediaSearchData.object.pilimit = 'max';
                    wikipediaSearchData.object.exlimit = 'max';
                    wikipediaSearchData.object.exintro = '';

                    wikipediaSearchData = this.fillDataInObjectByList(wikipediaSearchData, _params, [
                        'prop', 'generator', 'gsrsearch', 'pilimit', 'exlimit', 'exintro', 'rvparse', 'formatversion', 'prop', 'pithumbsize', 'gsrlimit'
                    ]);
                    wikipediaSearchData.url = this.getApiBaseUrl(_params.lang);
                    break;

                case "searchArticles":
                    wikipediaSearchData.object.prop = 'extracts|pageimages|info';
                    wikipediaSearchData.object.generator = 'search';
                    wikipediaSearchData.object.gsrsearch = _params.term;
                    wikipediaSearchData.object.pilimit = 'max';
                    wikipediaSearchData.object.exlimit = 'max';
                    wikipediaSearchData.object.exintro = '';

                    wikipediaSearchData = this.fillDataInObjectByList(wikipediaSearchData, _params, [
                        'prop', 'generator', 'gsrsearch', 'pilimit', 'exlimit', 'exintro', 'rvparse', 'formatversion', 'prop', 'pithumbsize', 'gsrlimit'
                    ]);
                    wikipediaSearchData.url = this.getApiBaseUrl(_params.lang);
                    break;

                case "getArticle":
                    wikipediaSearchData.object.prop = 'extracts|pageimages|images|info';
                    wikipediaSearchData.object.titles = _params.term;

                    wikipediaSearchData = this.fillDataInObjectByList(wikipediaSearchData, _params, [
                        'prop', 'rvparse', 'formatversion', 'prop', 'pithumbsize'
                    ]);
                    wikipediaSearchData.url = this.getApiBaseUrl(_params.lang);
                    break;
            }
            return wikipediaSearchData;
        };
    });

/**
    @name: angular-youtube-api-factory
    @version: 0.6.2 (23-09-2016)
    @author: Jonathan Hornung
    @url: https://github.com/JohnnyTheTank/angular-youtube-api-factory#readme
    @license: MIT
*/

angular.module('aio')
    .factory('youtubeFactory', ['$http', 'youtubeSearchDataService', function ($http, youtubeSearchDataService) {

        var youtubeFactory = {};

        youtubeFactory.getVideosFromChannelById = function (_params) {
            var youtubeSearchData = youtubeSearchDataService.getNew("videosFromChannelById", _params);
            return $http({
                method: 'GET',
                url: youtubeSearchData.url,
                params: youtubeSearchData.object,
            });
        };

        youtubeFactory.getVideosFromSearchByParams = function (_params) {
            var youtubeSearchData = youtubeSearchDataService.getNew("videosFromSearchByParams", _params);
            return $http({
                method: 'GET',
                url: youtubeSearchData.url,
                params: youtubeSearchData.object,
            });
        };

        youtubeFactory.getVideosFromPlaylistById = function (_params) {
            var youtubeSearchData = youtubeSearchDataService.getNew("videosFromPlaylistById", _params);
            return $http({
                method: 'GET',
                url: youtubeSearchData.url,
                params: youtubeSearchData.object,
            });
        };

        youtubeFactory.getChannelById = function (_params) {
            var youtubeSearchData = youtubeSearchDataService.getNew("channelById", _params);
            return $http({
                method: 'GET',
                url: youtubeSearchData.url,
                params: youtubeSearchData.object,
            });
        };

        youtubeFactory.getVideoById = function (_params) {
            var youtubeSearchData = youtubeSearchDataService.getNew("videoById", _params);
            return $http({
                method: 'GET',
                url: youtubeSearchData.url,
                params: youtubeSearchData.object,
            });
        };

        return youtubeFactory;
    }])
    .service('youtubeSearchDataService', function () {
        this.getApiBaseUrl = function (_params) {
            return "https://content.googleapis.com/youtube/v3/";
        };

        this.fillDataInObjectByList = function (_object, _params, _list) {

            angular.forEach(_list, function (value, key) {
                if (typeof value !== "undefined"  && value.constructor === Array) {
                    if (angular.isDefined(_params[value[0]])) {
                        _object.object[value[0]] = _params[value[0]];
                    } else {
                        _object.object[value[0]] = value[1];
                    }
                } else {
                    if (angular.isDefined(_params[value])) {
                        _object.object[value] = _params[value];
                    }
                }
            });

            return _object;
        };

        this.getNew = function (_type, _params) {

            var youtubeSearchData = {
                object: {
                    //key: '_params.key',
                    key: 'AIzaSyDK4NOPjn7RhVWC3u-k7nahgyY4dYtGCZw',
                },
                url: '',
            };

            switch (_type) {
                case 'videosFromChannelById':

                    youtubeSearchData = this.fillDataInObjectByList(youtubeSearchData, _params, [
                        ['part', 'id,snippet'],
                        ['type', 'video'],
                        ['order', 'date'],
                        ['videoEmbeddable', true],
                        'channelId',
                        'q',
                        'maxResults',
                        'publishedAfter',
                        'publishedBefore',
                        'regionCode',
                        'relevanceLanguage',
                        'safeSearch',
                        'videoLicense',
                        'videoSyndicated',
                        'fields'
                    ]);

                    youtubeSearchData.url = this.getApiBaseUrl() + 'search?';

                    if (_params.nextPageToken || _params.prevPageToken) {
                        youtubeSearchData.url += 'pageToken=' + (_params.nextPageToken || _params.prevPageToken) + '&';
                    }
                    break;

                case 'videosFromSearchByParams':

                    youtubeSearchData = this.fillDataInObjectByList(youtubeSearchData, _params, [
                        ['part', 'id,snippet'],
                        ['type', 'video'],
                        ['order', 'date'],
                        ['videoEmbeddable', true],
                        'location',
                        'q',
                        'maxResults',
                        'publishedAfter',
                        'publishedBefore',
                        'regionCode',
                        'relevanceLanguage',
                        'safeSearch',
                        'videoLicense',
                        'videoSyndicated',
                        'fields'
                    ]);

                    if (angular.isDefined(_params.locationRadius)) {
                        youtubeSearchData.object.locationRadius = _params.locationRadius;
                    } else {
                        if (angular.isDefined(_params.location)) {
                            youtubeSearchData.object.locationRadius = '5000m';
                        }
                    }

                    youtubeSearchData.url = this.getApiBaseUrl() + 'search?';
                    if (_params.nextPageToken || _params.prevPageToken) {
                        youtubeSearchData.url += 'pageToken=' + (_params.nextPageToken || _params.prevPageToken) + '&';
                    }
                    break;

                case 'videosFromPlaylistById':

                    youtubeSearchData = this.fillDataInObjectByList(youtubeSearchData, _params, [
                        ['part', 'id,snippet'],
                        ['type', 'video'],
                        'playlistId',
                        'maxResults',
                        'fields'
                    ]);

                    youtubeSearchData.url = this.getApiBaseUrl() + 'playlistItems?';
                    if (_params.nextPageToken || _params.prevPageToken) {
                        youtubeSearchData.url += 'pageToken=' + (_params.nextPageToken || _params.prevPageToken) + '&';
                    }
                    break;

                case 'videoById':
                    youtubeSearchData = this.fillDataInObjectByList(youtubeSearchData, _params, [
                        ['part', 'id,snippet,contentDetails,statistics'],
                    ]);

                    youtubeSearchData.object.id = _params.videoId;

                    youtubeSearchData.url = this.getApiBaseUrl() + 'videos?';
                    if (_params.nextPageToken || _params.prevPageToken) {
                        youtubeSearchData.url += 'pageToken=' + (_params.nextPageToken || _params.prevPageToken) + '&';
                    }
                    break;

                case 'channelById':
                    youtubeSearchData = this.fillDataInObjectByList(youtubeSearchData, _params, [
                        ['part', 'id,snippet'],
                        ['type', 'channel']
                    ]);

                    youtubeSearchData.url = this.getApiBaseUrl() + 'search?';
                    if (_params.nextPageToken || _params.prevPageToken) {
                        youtubeSearchData.url += 'pageToken=' + (_params.nextPageToken || _params.prevPageToken) + '&';
                    }
                    break;
            }

            return youtubeSearchData;
        };
    });
