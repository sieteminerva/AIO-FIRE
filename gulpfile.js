/* Module in Use */
var gulp = require('gulp');
var fs = require('fs');
var plugins = require('gulp-load-plugins')({ lazy: true });
var browserSync = require('browser-sync').create();
var lazypipe = require('lazypipe');
var modRewrite = require('connect-modrewrite');
var wiredep = require('wiredep').stream;
var mainBowerFiles = require('main-bower-files');
var templateCache = require('gulp-angular-templatecache');
var runSequence = require('run-sequence');

/* Variable Folder */
var base = './';
var dest = base + 'public/';
var src = base + '_kitchen/';
var temp = base + '.tmp/';
var assets = dest + 'assets/';
var frameworks = assets + 'frameworks/';

/* Logging Message */
function log(msg) {
    if (typeof(msg) === ' object ') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                plugins.util.log(plugins.util.colors.green(msg(item)));
            }
        }
    } else {
        plugins.util.log(plugins.util.colors.black.bgGreen(msg));
    }
}

/* Options */
var options = {
    cwd: './',
    allFiles: {
        js: ['**/*.js'],
        css: ['**/*.css'],
        pug: ['**/*.pug'],
        blade: ['**/*.blade.php'],
        php: ['**/*.php'],
        html: ['**/*.html'],
        less: ['**/*.less'],
        combine: ['*.+(js|css)']
    },
    matching: {
        modules: ['**/*.+(app|module|modules).js'],
        controllers: ['**/*.+(controller|controllers).js'],
        services: ['**/*.+(factory|service|services).js'],
        routes: ['**/*.+(route|routes).js'],
        templates: ['**/*.+(template|templates).js'],
        components: ['**/*.+(directives|directive|components|component).js'],
        others: ['**/*.+(locale|filter|constant).js'],
        pug: ['pug/**/*.pug'],
        views: ['views/**/*.pug'],
        html: ['html/**/*.html'],
        i18n: {
            id: ['i18n/id-ID/*.json'],
            en: ['i18n/en-US/*.json']
        },
        less: {
            level_1: ['**/+(aio-)**.less'],
        },
        main_styles: ['**/+(aio-)**.css']
    },
    printPath: {
        onCopy: function(filepath) {
            return "Copying: " + filepath + ' DONE';
        },
        onRemove: function(filepath) {
            return "Removing: " + filepath + ' DONE';
        },
        onInject: function(filepath) {
            return 'injecting: ' + filepath + ' DONE';
        },
        onCompile: function(filepath) {
            return 'Compiling: ' + filepath + ' DONE';
        }
    },
    injection: {

        kitchen: {
            js: {
                starttag: '<!-- injected js kitchen -->',
                endtag: '<!-- end inject -->',
                transform: function(filepath) {
                    filepath = filepath.replace('/public', '');
                    return '<script src="' + filepath + '"></script>';
                }
            },
            css: {
                starttag: '<!-- injected css kitchen -->',
                endtag: '<!-- end inject -->',
                transform: function(filepath) {
                    filepath = filepath.replace('/public', '');
                    return '<link rel="stylesheet" href="' + filepath + '">';
                }
            },
            jsFrameworks: {
                starttag: '<!-- injected frameworks js kitchen -->',
                endtag: '<!-- end inject -->',
                transform: function(filepath) {
                    filepath = filepath.replace('/kitchen/app/', '');
                    return '<script src="' + filepath + '"></script>';
                }
            },
            cssFrameworks: {
                starttag: '<!-- injected frameworks css kitchen -->',
                endtag: '<!-- end inject -->',
                transform: function(filepath) {
                    filepath = filepath.replace('/kitchen/app/', '');
                    return '<link rel="stylesheet" href="' + filepath + '">';
                }
            },
            less: {
                relative: true,
                starttag: '/* imported less */',
                endtag: '/* endimport */',
                transform: function(filepath) {
                    return '@import "' + filepath + '";';
                }
            },
            bower: {
                cwd: './',
                src: './public/assets/frameworks',
                fileTypes: {
                    html: {
                        block: /(([ \t]*)<!--\s*frameworks:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endframeworks\s*-->)/gi,
                        replace: {
                            js: '<script src="' + '{{filePath}}' + '"></script>',
                            css: '<link rel="stylesheet" href="' + '{{filePath}}' + '">'
                        }
                    }
                }
            }
        }
    },
    template: {
      view: {
        angular: {
          root: '',
          module: 'aio',
          filename: 'aio-view.templates.js'
        },
        html: {
          cwd: '_kitchen/'
        }
      },
    }
};

// injecting less
gulp.task('aio-inject:kitchen:less', function(done) {
    var lessSource = gulp.src([src + 'app/**/*.less'], { read: false });
    return gulp
        .src([src + 'app.less'])
        .pipe(plugins.inject(lessSource, options.injection.kitchen.less))
        .pipe(gulp.dest(src))
    done();
});

// compiling less
gulp.task('aio-compile:kitchen:less', function(done) {
    return gulp
        .src([src + 'app.less'])
        .pipe(plugins.plumber())
        .pipe(plugins.less())
        .pipe(plugins.autoprefixer({ browsers: ['last 2 versions', '> 5%'] }))
        .pipe(gulp.dest(assets + 'stylesheets'))
    done();
});


// compiling pug to Angular Templatecache
gulp.task('aio-compile:angular-template', function() {
  //log('Compiling your *.pug to *.template.js code for angular templateCache views');
  return gulp
    .src([src + options.allFiles.pug])
    .pipe(plugins.changed(assets + 'scripts/' + 'aio-view.templates.js'))
    .pipe(plugins.data(function() {
      return JSON.parse(fs.readFileSync('./site.config.json'));
    }))
    .pipe(plugins.plumber())
    .pipe(plugins.changed(src + options.allFiles.pug))
    .pipe(plugins.pug({ pretty: true }))
    .pipe(plugins.htmlmin({collapseWhitespace: true}))
    .pipe(templateCache(options.template.view.angular))
    .pipe(gulp.dest(assets + 'scripts/'))
    .pipe(browserSync.reload({stream:true}))
    .pipe(plugins.print(options.printPath.onCompile));
});


// inject bower kitchen
gulp.task('aio-inject:kitchen:bower', function(done) {
    return gulp
        .src(dest + 'index.html')
        .pipe(wiredep(options.injection.kitchen.bower))
        .pipe(gulp.dest(dest))
    done();
});

gulp.task('aio-concat:js:code', function(done){
  return gulp
  .src([
        src + 'app.js',
        src + 'app.*(routes|factory|services).js',
        src + '**/*.js',
        '!' + frameworks + 'aio.frameworks.js'
  ])
  .pipe(plugins.concat('aio-app.js'))
  .pipe(gulp.dest(assets + 'scripts/'))
  .pipe(browserSync.reload({stream:true}));
});

// Injecting js and css
gulp.task('aio-inject:kitchen:code', function(done) {
    var jsSource = gulp.src([
        assets + 'scripts/aio-app.js',
        assets + 'scripts/aio-view.templates.js',
        '!' + frameworks + 'aio.frameworks.js'
    ], { read: false });
    var cssSource = gulp.src([
        assets + 'stylesheets/**/*.css',
        '!' + frameworks + 'aio.frameworks.css'
    ], { read: false });

    return gulp
        .src(dest + 'index.html')
        .pipe(plugins.inject(jsSource, options.injection.kitchen.js))
        .pipe(plugins.inject(cssSource, options.injection.kitchen.css))
        .pipe(gulp.dest(dest))
        .pipe(browserSync.reload({stream:true}))
    done();
});


// compiling pug
gulp.task('aio-compile:kitchen:pug', function() {
    return gulp
        .src([src + options.allFiles.pug])
        .pipe(plugins.changed(dest + 'views', { extension: '.html' }))
        //.pipe(plugins.newer(dest + 'views'))
        .pipe(plugins.pug({ pretty: true }))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(dest + 'views'))
        //.pipe(browserSync.reload({stream:true}))
    ;
});

/*building frameworks depedencies*/
gulp.task('aio-clean:kitchen:frameworks', function(done) {
    return gulp
        .src(frameworks)
        .pipe(plugins.clean())
    done();
});

var uglifying = lazypipe()
    .pipe(plugins.uglify)
    .pipe(plugins.rename, function(path) {
        path.extname = ".min.js";
    });

gulp.task('aio-build:kitchen-frameworks:js', function(done) {
    jsFilter = plugins.filter(['**/*.js'], { restore: true });
    return gulp
        .src(mainBowerFiles())
        .pipe(jsFilter)
        .pipe(plugins.concat('aio.frameworks.js'))
        //.pipe(uglifying())
        .pipe(gulp.dest(dest + 'assets/frameworks'))
        .pipe(browserSync.reload({ stream: true }))
    done();
});

gulp.task('aio-build:kitchen-frameworks:css', function(done) {
    cssFilter = plugins.filter(['**/*.css']);
    return gulp
        .src(mainBowerFiles())
        .pipe(cssFilter)
        .pipe(plugins.concat('aio.frameworks.css'))
        .pipe(plugins.replace('https://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic&subset=latin', ''))
        .pipe(plugins.replace('Lato', 'Open Sans'))
        .pipe(plugins.replace('"./themes/default/assets/fonts/', '"../fonts/icons/'))
        .pipe(plugins.replace('"./themes/default/assets/images/', '"../images/'))
        .pipe(gulp.dest(dest + 'assets/frameworks'))
        //.pipe(browserSync.reload({stream:true}))
    done();
});

gulp.task('aio-inject:kitchen:frameworks', function(done) {
    var jsFrameworksSource = gulp.src([frameworks + 'aio.frameworks.js'], { read: false });
    var cssFrameworksSource = gulp.src([frameworks + 'aio.frameworks.css'], { read: false });
    return gulp
      .src([base + 'index.html'])
      .pipe(plugins.inject(cssFrameworksSource, options.injection.kitchen.cssFrameworks))
      .pipe(plugins.inject(jsFrameworksSource, options.injection.kitchen.jsFrameworks))
      .pipe(gulp.dest(base))
      //.pipe(browserSync.reload({ stream: true }))
    done();
});




// Watching files task
gulp.task('aio-watch:kitchen', function() {
    // watch src less files
    var lessKitchenFiles = [src + 'app/' + options.allFiles.less];
    plugins.watch(lessKitchenFiles, function() {
        gulp.start('aio-inject:kitchen:less');
    });
    // watch base app.les
    var lessWrapper = [src + 'app.less'];
    plugins.watch(lessWrapper, function() {
        gulp.start('aio-compile:kitchen:less');
    });
    // watch src pug files
    var pugKitchenFiles = [src + options.allFiles.pug];
    plugins.watch(pugKitchenFiles, function() {
        gulp.start('aio-compile:angular-template');
    });
    //watch dest html
    // plugins.watch([dest + '**/*.html'], function(){
    //   browserSync.reload({stream:true});
    // });
    // watch src js files
    var kitchenCodes = [
        src + '**/*.js'
    ];
    plugins.watch(kitchenCodes, function() {
        gulp.start('aio-concat:js:code');
    });
    // watch frameworks
    var kitchenFrameworks = [
        frameworks + options.allFiles.js,
        frameworks + options.allFiles.css,
    ];
    plugins.watch(kitchenFrameworks, function() {
        gulp.start('aio-inject:kitchen:frameworks');
    });
});

gulp.task('aio-server:kitchen', function() {
    browserSync.init({
        host: '192.168.1.60',
        //tunnel: true,
        port: 6060,
        server: {
            baseDir: dest,
            middleware: [
                modRewrite([
                    '!\\.\\w+$ /index.html [L]'
                ])
            ]
        },
        plugins: [{
            module: 'bs-html-injector',
            options: {
                files: [base + 'index.html', dest + 'views/*.html']
            }
        }],
        files: [{
            match: [
                src + ' **/*.{less, js}',
                assets + 'scripts/*.js}',
                assets + 'stylesheets/*.css}',
            ],
        }],
        ghostMode: {
            clicks: true,
            locations: false,
            forms: true,
            scroll: true
        },
        reloadDelay: 4000,
        reloadDebounce: 0,
        injectChanges: true,
        logFileChanges: true,
        logPrefix: 'AIO-KITCHEN',
        notify: true,
    });
});

gulp.task('aio:kitchen:start', function() {
    runSequence(
        //['aio-build:kitchen-frameworks:css', 'aio-build:kitchen-frameworks:js', 'aio-inject:kitchen:frameworks'],
        ['aio-inject:kitchen:bower'],
        ['aio-inject:kitchen:less', 'aio-compile:kitchen:less'],
        ['aio-concat:js:code', 'aio-compile:angular-template'],
        'aio-inject:kitchen:code',
        'aio-server:kitchen',
        'aio-watch:kitchen'
    );
});
