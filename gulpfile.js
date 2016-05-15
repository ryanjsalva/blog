var gulp = require('gulp');
var rename = require('gulp-rename');
var imageResize = require('gulp-image-resize');
var changed = require("gulp-changed");
var minify = require('gulp-minify');
var css = require('gulp-clean-css');

gulp.task("default", function () {

  // compress all JPG and PNGs in /_assets and move them to /assets 
  gulp.src(['_assets/**/*.{jpg,png,gif}', '!_assets/**/*-cover.{jpg,png,gif}'])
    .pipe(changed("assets"))
    .pipe(imageResize({ quality : .5 }))
    .pipe(gulp.dest("assets"));

  // create a thumbnail for cover images
  gulp.src("_assets/*-cover.{jpg,png}")
    .pipe(changed("assets"))
    .pipe(gulp.dest("assets"))
    .pipe(imageResize({ 
      width : 150,
      quality : .5 
    }))
    .pipe(rename(function (path) { path.basename += "-small"; }))
    .pipe(gulp.dest("assets"));
  
});

// minify js
gulp.task('minify-js', function() {
  gulp.src('js/*.js')
    .pipe(minify({
        ext:{
            src:'.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['-min.js']
    }))
    .pipe(gulp.dest('js'))
});

// minify css and pipe it into /_includes
gulp.task('minify-css', function() {
  return gulp.src('styles/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('_includes/'));
});
