var gulp = require('gulp');
var rename = require('gulp-rename');
var imageResize = require('gulp-image-resize');
var changed = require("gulp-changed");

gulp.task("default", function () {
  gulp.src("_assets/*.{jpg,png}")
    .pipe(changed("assets"))
    .pipe(imageResize({ quality : .6 }))
    .pipe(rename(function (path) { path.basename += "-rspv"; }))
    .pipe(gulp.dest("assets"));
});
