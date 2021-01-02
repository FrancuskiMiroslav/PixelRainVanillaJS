const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const webpack = require('webpack-stream');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const mode = require('gulp-mode')();
const browserSync = require('browser-sync').create();

let settings = {
	clean: true,
	scripts: true,
	polyfills: true,
	styles: true,
	svgs: true,
	copy: true,
	reload: true,
};

let paths = {
	input: 'src/',
	output: 'dist/',
	scripts: {
		input: 'src/js/*',
		polyfills: '.polyfill.js',
		output: 'dist/js/',
	},
	styles: {
		input: 'src/scss/**/*.{scss,sass}',
		output: 'dist/css/',
	},
	svgs: {
		input: 'src/svg/*.svg',
		output: 'dist/svg/',
	},
	copy: {
		input: 'src/copy/**/*',
		output: 'dist/',
	},
	reload: './dist/',
};

// clean tasks
const clean = () => {
	return del(['dist']);
};

const cleanHtml = () => {
	return del(['dist/**/*.html']);
};

const cleanImages = () => {
	return del(['dist/assets/images']);
};

const cleanFonts = () => {
	return del(['dist/assets/fonts']);
};

// css task
const css = () => {
	return src('src/scss/main.scss')
		.pipe(mode.development(sourcemaps.init()))
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(rename('app.css'))
		.pipe(mode.production(csso()))
		.pipe(mode.development(sourcemaps.write()))
		.pipe(dest('dist'))
		.pipe(mode.development(browserSync.stream()));
};

// js task
const js = () => {
	return src('src/**/*.js')
		.pipe(
			babel({
				presets: ['@babel/env'],
			})
		)
		.pipe(
			webpack({
				mode: 'development',
				devtool: 'inline-source-map',
			})
		)
		.pipe(mode.development(sourcemaps.init({ loadMaps: true })))
		.pipe(rename('app.js'))
		.pipe(mode.production(terser({ output: { comments: false } })))
		.pipe(mode.development(sourcemaps.write()))
		.pipe(dest('dist'))
		.pipe(mode.development(browserSync.stream()));
};

// copy tasks
const copyImages = () => {
	return src('src/assets/images/**/*.{jpg,jpeg,png,gif,svg}').pipe(
		dest('dist/assets/images')
	);
};

const copyFonts = () => {
	return src('src/assets/fonts/**/*.{svg,eot,ttf,woff,woff2}').pipe(
		dest('dist/assets/fonts')
	);
};

const copyHtml = () => {
	return src('src/**/*.html').pipe(dest('dist'));
};

// Copy static files into output folder
const copyFiles = () => {
	// Make sure this feature is activated before running
	if (!settings.copy) return done();

	// Copy static files
	return src(paths.copy.input).pipe(dest(paths.copy.output));
};

// watch task
const watchForChanges = () => {
	browserSync.init({
		server: {
			baseDir: paths.reload,
		},
	});
	watch('src/scss/**/*.scss', css);
	watch('src/**/*.js', js);
	watch('**/*.html').on('change', browserSync.reload);
	watch('src/**/*.html', series(cleanHtml, copyHtml));
	watch(
		'src/assets/images/**/*.{png,jpg,jpeg,gif,svg}',
		series(cleanImages, copyImages)
	);
	watch(
		'src/assets/fonts/**/*.{svg,eot,ttf,woff,woff2}',
		series(cleanFonts, copyFonts)
	);
};

// public tasks
exports.default = series(
	clean,
	parallel(copyHtml, css, js, copyImages, copyFonts, copyFiles),
	watchForChanges
);
exports.build = series(
	clean,
	parallel(copyHtml, css, js, copyImages, copyFonts, copyFiles)
);
