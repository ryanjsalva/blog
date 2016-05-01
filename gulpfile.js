var gulp = require('gulp');
var rename = require('gulp-rename');
var imageResize = require('gulp-image-resize');
var changed = require("gulp-changed");

// compress all images in /_assets and move them to /assets 
gulp.task("screenshots", function () {
  gulp.src(['_assets/**/*.{jpg,png}', '!_assets/**/*-cover.{jpg,png}'])
//    .pipe(changed("assets"))
    .pipe(imageResize({ quality : .5 }))
//    .pipe(rename(function (path) { path.basename += "-lofi"; }))
    .pipe(gulp.dest("assets"));
});

// create a thumbnail for cover images
gulp.task("cover",function () {
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

gulp.task('default', ['screenshots', 'cover']);