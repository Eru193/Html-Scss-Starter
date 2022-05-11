const gulp = require("gulp");
const fileinclude = require("gulp-file-include");
const server = require("browser-sync").create();
const sass = require("gulp-sass")(require("node-sass"));
const concat = require("gulp-concat");
const cleancss = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");
const uglify = require("gulp-uglify-es").default;

const { watch, series } = require("gulp");

const patchs = {
  scripts: {
    src: "./src",
    dest: "./build/",
  },
};

// Reload Server
async function reload() {
  server.reload();
}

// Copy assets after build
async function copyAssets() {
  gulp
    .src([`${patchs.scripts.src}/assets/**/*`])
    .pipe(gulp.dest(`${patchs.scripts.dest}/assets/`));
}

// Scripts & JS Libraries
async function script() {
  return gulp
    .src([`${patchs.scripts.src}/js/_custom.js`])
    .pipe(concat("scripts.min.js"))
    .pipe(uglify()) // Minify js (opt.)
    .pipe(gulp.dest(`${patchs.scripts.dest}/js`));
}

// Sass compiler
async function compileSass() {
  gulp
    .src([`${patchs.scripts.src}/scss/**/*.scss`])
    .pipe(
      sass({
        outputStyle: "expanded",
        includePaths: [__dirname + "/node_modules"],
      })
    )
    .pipe(concat("styles.min.css"))
    .pipe(
      autoprefixer({
        // grid: true, // Optional. Enable CSS Grid
        overrideBrowserslist: ["last 10 versions"],
      })
    )
    .pipe(cleancss({ level: { 1: { specialComments: 0 } } })) // Optional. Comment out when debugging
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(`${patchs.scripts.dest}/css`));
}

// Build files html and reload server
async function buildAndReload() {
  await includeHTML();
  await copyAssets();
  await compileSass();
  await script();
  reload();
}

async function includeHTML() {
  return gulp
    .src([
      `${patchs.scripts.src}/index.html`,
      // "!header.html", // ignore
      // "!footer.html", // ignore
    ])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulp.dest(patchs.scripts.dest));
}
exports.includeHTML = includeHTML;

exports.default = async function () {
  // Init serve files from the build folder
  server.init({
    server: {
      baseDir: patchs.scripts.dest,
    },
  });
  // Build and reload at the first time
  buildAndReload();
  // Watch tasks
  watch("./app/scss/**/*.scss", series(compileSass));
  watch(
    [
      `${patchs.scripts.src}/*.html`,
      `${patchs.scripts.src}/templates/*.html`,
      `${patchs.scripts.src}/assets/**/*`,
      `${patchs.scripts.src}/scss/**/*.scss`,
      `${patchs.scripts.src}/js/_custom.js`,
    ],
    series(buildAndReload)
  );
};
