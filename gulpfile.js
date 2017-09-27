const gulp = require('gulp')
const babel = require("gulp-babel")
gulp.task('copy',  ()  => {
    gulp.src('./src/*/**')
    .pipe(gulp.dest('./build'))
});

gulp.task('copyPackage',  ()  => {
    gulp.src('./package.json')
    .pipe(gulp.dest('./build'))
});


gulp.task('build', function () {
    return gulp.src('./src')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('./build'));
});

// 'copy', 'copyPackage', 
gulp.task('default', ['build'], () => {
    console.log('build project success...')
})

