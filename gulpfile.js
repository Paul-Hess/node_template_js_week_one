var gulp = require('gulp');
 	browserify = require('browserify'),
 	source = require('vinyl-source-stream'),
 	concat = require('gulp-concat'),
 	uglify = require('gulp-uglify'),
 	utilities = require('gulp-util'),
 	del = require('del'),
 	jshint = require('gulp-jshint'),
 	lib = require('bower-files')(),
 	browserSync = require('browser-sync').create(),
 	mocha = require('gulp-mocha'),
 	sass = require('gulp-sass'),
 	sourcemaps = require('gulp-sourcemaps');
var buildProduction = utilities.env.production;



gulp.task('cssBuild', function() {
  return gulp.src('scss/*.scss')
    .pipe(sourcemaps.init()) 
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./build/stylesheets'))
    .pipe(browserSync.stream());
});

gulp.task('bowerJS', function() {
	return gulp.src(lib.ext('js').files)
	.pipe(concat('vendor.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('./build/js'));
});

gulp.task('test', function() {
	return gulp.src('./spec/specs.js', {read: false})
	.pipe(mocha({reporter: 'nyan'}));
});



// run vendor builds in one task
gulp.task('bower', ['bowerJS']);


// make files readable by browser, jin them into one file, minify them, and refresh the file each time.
gulp.task('concat', function() {
	return gulp.src(['./js/*.js'])
	.pipe(concat('allConcat.js'))
	.pipe(gulp.dest('.tmp'));
});

gulp.task('jsBrowserify', ['concat'], function() {
	return browserify( {entries: ['.tmp/allConcat.js'] })
	.bundle()
	.pipe(source('app.js'))
	.pipe(gulp.dest('./build/js'));
});

gulp.task('minifyScripts', ['jsBrowserify'], function() {
	return gulp.src('build/js/app.js')
	.pipe(uglify())
	.pipe(gulp.dest('./build.js'));
});

gulp.task('clean', function() {
	return del('build/js', 'tmp');
});


// run the above three or four tasks all at once based on the dev or deploy envirinment, run vendor build and css build always.
gulp.task('build', ['clean'], function() {
	if (buildProduction) {
		gulp.start('minifyScripts');
	} else {
		gulp.start('jsBrowserify');
	}
	gulp.start('bower');
	gulp.start('cssBuild');
});

// run a linter on all custom js files.
gulp.task('jshint', function() {
	gulp.src('js/*.js')
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

// ready js files for browser, lint them nd reset server automaitically.
gulp.task('jsBuild', ['jsBrowserify', 'jshint'], function() {
	browserSync.reload();
});

// ready vendor.js for browser and reset server automaitically.
gulp.task('bowerBuild', ['bower'], function() {
	browserSync.reload();
});

// reload page on html file change.
gulp.task('htmlBuild', function() {
		browserSync.reload();
	})

// run dev server and run previous two tasks, reload the served page on changes to files.
gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: './',
			index: 'index.html'
		}
	});
	gulp.watch(['js/*.js'], ['test']);
	gulp.watch(['js/*.js'], ['jsBuild']);
	gulp.watch(['bower.json'], ['bowerBuild']);
	gulp.watch(['*.html'], ['htmlBuild']);
	gulp.watch(['app/*.ts'], ['test', 'jsBuild']);
	gulp.watch(['scss/*.scss', 'scss/*/*.scss'], ['cssBuild']);
});