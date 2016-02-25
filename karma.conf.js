// Karma configuration
// Generated on Tue Oct 20 2015 16:52:59 GMT+0200 (CEST)

module.exports = function(config) {
  config.set({

    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',
	
	// Use proxy to out stub server which is launched on port 3000
	// Used in couple with ng-scenario plugin to make integration tests
    proxies: {
      '/': 'http://localhost:3000'
    },
    urlRoot: '/__karma__/',

    // Frameworks to use
    // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine-ajax', 'jasmine'],

    // Uncomment to have control on all the used packages
    // By default all plugins are included
    // plugins: ['karma-qunit', 'karma-jasmine', 'karma-chrome-launcher', 'karma-commonjs-preprocessor', 'karma-html2js-preprocessor'],

    // List of files / patterns to load in the browser
    files: [
      'node_modules/commonjs-require-definition/require.js',
      // 'node_modules/karma-jasmine-ajax/node_modules/jasmine-ajax/lib/mock-ajax.js',
      'vendor/jquery-1.11.1.js',
      'vendor/jquery.mobile-1.3.2.js',
      'vendor/jquery.auto-complete.js',
      'vendor/jquery.imagesloaded.js',
      'vendor/jqm-datebox-1.4.0.js',
      'vendor/lodash.js',
      'vendor/backbone.js',
      'vendor/*.js',
      'client/js/**/*.js',

      // Mocks
      'stub_server/**/*.json',

      'client/tests/integration/**/*.spec.js'
    ],

    // List of files to exclude
    exclude: [
    ],

    // Preprocess matching files before serving them to the browser
    // Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
       // '**/client/js/**/*.js': ['coverage'],
       'client/js/**/*.js': ['commonjs'],
       'stub_server/**/*.json': ['json_fixtures']
    },

    // Configure the reporter
    coverageReporter: {
        dir : 'client/tests/report/',
        reporters: [
            { type: 'html', subdir: 'html-coverage' },
            { type: 'cobertura',  subdir: '.' },
            { type: 'lcov', subdir: './lcov' }
        ]
    },

    // Replace 
    commonjsPreprocessor: {
      options: {
        pathReplace: function(path) {
	        var newPath = path.replace(/^client[\\\/](js[\\\/]|)/,'');
          return newPath;
        }
      }
    },

    // Test results reporter to use
    // possible values: 'dots', 'progress'
    // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'html', 'coverage'],

    // The default configuration
    htmlReporter: {
      outputDir: 'karma_html',  // where to put the reports 
      templatePath: null,       // set if you moved jasmine_template.html
      focusOnFailures: true,    // reports show failures on start
      namedFiles: false,        // name files instead of creating sub-directories
      pageTitle: null,          // page title for reports; browser info by default
      urlFriendlyName: false,   // simply replaces spaces with _ for files/dirs
      reportName: 'report-summary-filename', // report summary filename; browser info by default
      
      
      // Experimental
      preserveDescribeNesting: false, // folded suites stay folded 
      foldAll: false, // reports start folded (only with preserveDescribeNesting)
    },

    // Web server port
    port: 9876,

    // Enable / disable colors in the output (reporters and logs)
    colors: true,


    // Level of logging
    // Possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers
    // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
