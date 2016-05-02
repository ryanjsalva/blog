var gulp = require('gulp');
var rename = require('gulp-rename');
var imageResize = require('gulp-image-resize');
var changed = require("gulp-changed");

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

