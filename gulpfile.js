const gulp = require('gulp')
const babel = require("gulp-babel")
gulp.task('copy', () => {
    gulp.src('./src/**/*')
        .pipe(gulp.dest('./build'))
});

gulp.task('copyPackage', () => {
    gulp.src('./package.json')
        .pipe(gulp.dest('./build'))
});


gulp.task('build', function () {
    setTimeout(() => {
        return gulp.src('./src/**/*.js')
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(gulp.dest('./build'))
    }, 1000)
});

gulp.task('default', ['copy','copyPackage', 'build'], () => {
    console.log('load project success.')
})

