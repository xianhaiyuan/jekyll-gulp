var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var cp          = require('child_process');
var $ = require('gulp-load-plugins')();
var del = require('del');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var cssgrace = require('cssgrace');
var reload = browserSync.reload;

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};


gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

var processors = [
    autoprefixer({
      browsers: ['>1%', 'last 15 version', 'ie 8', 'ie 7']
    }),
    cssgrace
];
var errorHandler = {errorHandler: $.notify.onError("Error: <%= error.message %>")};

var csstask = {
  dev: function(taskname, srcpath, destpath, spritePre, spriteDest){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.plumber(errorHandler))
      .pipe($.sass({
        outputStyle: 'compact'
      }))
      .pipe($.postcss(processors))
      .pipe($.cssSpriter({
        'spriteSheet': spritePre + 'img/icon/spriter.png',
        'pathToSpriteSheetFromCSS': spriteDest
      }))
      .pipe(gulp.dest(destpath))
      .pipe($.notify('csstask success'))
      .pipe(reload({stream:true}));
    });
  },
  build: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.cssnano({
              discardComments: {
                  removeAll: true
              }
          }))
      .pipe(gulp.dest(destpath))
      .pipe($.notify('csstask success'))
      .pipe(reload({stream:true}));
    });
  }
};

csstask.dev('css:dev', 'src/scss/*.scss', '_site/css', '_site/', '../img/icon/spriter.png');
csstask.dev('css_com:dev', 'src/scss/common/*.scss', '_site/css/common', '_site/', '../../img/icon/spriter.png');

var imgtask = {
  dev: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.plumber(errorHandler))
      .pipe(gulp.dest(destpath))
      .pipe(reload({stream:true}))
      .pipe($.notify('imgtask success'));
    });
  },
  build: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.imagemin())
      .pipe(gulp.dest(destpath))
      .pipe($.notify('imgtask success'))
    });
  }
};

imgtask.dev('img:dev', 'img/*', '_site/img');
imgtask.build('img:build', '_site/img/*', 'img');
imgtask.build('img_icon:build', '_site/img/icon/*', 'img/icon');

var jstask = {
  dev: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.plumber(errorHandler))
      .pipe(gulp.dest(destpath))
      .pipe($.notify('jstask success'))
      .pipe(reload({stream:true}));
    });
  },
  build: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.uglify())
      .pipe(gulp.dest(destpath))
      .pipe($.notify('jstask success'));
    });
  }
};

jstask.dev('js:dev', 'src/js/*.js', '_site/js');
jstask.dev('js_com:dev', 'src/js/common/*.js', '_site/js/common');

var htmltask = {
  dev: function(taskname, srcpath, destpath){
    return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.plumber(errorHandler))
      .pipe(gulp.dest(destpath))
      .pipe($.notify('htmltask success'))
      .pipe(reload({stream:true}));
    });
  },
  build: function(taskname, srcpath, destpath){
      return gulp.task(taskname, function(){
      return gulp.src(srcpath)
      .pipe($.useref())
      .pipe($.if('*.css', $.cssnano({
            discardComments: {
                removeAll: true
            }
        })))
      .pipe($.if('*.js', $.uglify()))
      .pipe(gulp.dest(destpath))
      .pipe($.notify('htmltask success'))
      .pipe(reload({stream:true}));
    });
  }
};

htmltask.dev('includes:dev', '_includes/*.html', '_site/_includes');
htmltask.dev('layouts:dev', '_layouts/*.html', '_site/_layouts');
htmltask.build('layouts:build', '_site/_layouts/*.html', '_layouts');
htmltask.build('includes:build', '_site/_includes/*.html', '_includes');
htmltask.build('star:build', '_site/star/*.html', 'star');
htmltask.build('blog:build', '_site/blog/*.html', 'blog');

var fonttask = function(taskname, srcpath, destpath){
  return gulp.task(taskname, function(){
    return gulp.src(srcpath)
    .pipe($.plumber(errorHandler))
    .pipe(gulp.dest(destpath))
    .pipe(reload({stream:true}));
  })
};

fonttask('font:dev', 'css/fonts/font/*', '_site/css/fonts/font');
fonttask('font_icon:dev', 'css/fonts/iconfont/*', '_site/css/fonts/iconfont');

gulp.task('browser-sync', [ 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    $.runSequence(['css:dev', 
                   'css_com:dev', 
                   'js:dev',
                   'js_com:dev',
                   'includes:dev',
                   'layouts:dev',
                   'img:dev',
                   'font:dev',
                   'font_icon:dev']);
    browserSync.reload();
});

gulp.task('watch', function () {
    gulp.watch('src/scss/*.scss', ['css:dev']);
    gulp.watch('src/scss/common/*.scss', ['css_com:dev']);
    gulp.watch('src/js/*.js', ['js:dev']);
    gulp.watch('src/js/common/*.js', ['js_com:dev']);
    gulp.watch('img/*', ['img:dev']);
    gulp.watch(['*.html',
                '_layouts/*.html',
                '_posts/*', 
                '_includes/*.html',
                'star/*.html',
                'blog/*.html',
                'css/fonts/font/*',
                'css/fonts/iconfont/*'], ['jekyll-rebuild']);
    browserSync.reload();
});

gulp.task('default', $.sequence( 'browser-sync', 
                                ['css:dev', 
                                'css_com:dev', 
                                'js:dev',
                                'js_com:dev',
                                'includes:dev',
                                'layouts:dev',
                                'img:dev'],
                                'watch'));

gulp.task('build', $.sequence('img:build',
                              'img_icon:build',
                              'includes:build',
                              'layouts:build',
                              'star:build',
                              'blog:build'));
