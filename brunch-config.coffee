module.exports = config:
  paths:
    watched: ['client','test','vendor','bower_components']
    public: 'output-dev'  # in development mode, the output is on folder 'output-dev' wher files are not uglified
  overrides:
    production:
      optimize: true
      sourceMaps: false
      plugins: autoReload: enabled: false
      paths:
        watched: ['client','vendor','bower_components']
        public: '..[\\\/]ngEO-LWS[\\\/]public' # in optimisation mode, the output is on folder 'output-opt' wher files are uglified
  files:
    javascripts:
      joinTo:
        'js/libraries.js': /^(bower_components|vendor)/
        'js/main-ngeo.js': /^client[\\\/]js[\\\/](?!(map|data\-services\-area\.js|account\.js))/
        'js/map/map.js': /^client[\\\/]js[\\\/]map/
        'js/data-services-area.js': /^client[\\\/]js[\\\/]data\-services\-area\.js/
        'js/account.js': /^client[\\\/]js[\\\/]account\.js/
        'js/home.js': /^client[\\\/]js[\\\/]home\.js|configuration\.js/
      order: 
        before:[
          'vendor/jquery-1.11.1.js',
          'vendor/jquery.mobile-1.3.2.js',
          'vendor/jquery.auto-complete.js',
          'vendor/jquery.imagesloaded.js',
          'vendor/jqm-datebox-1.4.0.js',
          'vendor/lodash.js',
          'vendor/backbone.js']
    stylesheets:
      joinTo: 
        'css/main.css': /^client[\\\/]css[\\\/]main\.less$/
        'css/home.css': /^client[\\\/]css[\\\/]home\.less$/
        'css/help.css': /^client[\\\/]css[\\\/]help\.less$/
        'css/userManual.css': /^client[\\\/]css[\\\/]userManual\.less$/
        'css/vendor.css': /^(bower_components|vendor)[\\\/]/
    templates:
      defaultExtension: 'jst'
      joinTo: 
        'js/main-templates.js': /^client[\\\/]/
  conventions:
    assets: /^client[\\\/](?!((css[\\\/].*\.(less|css|map))|.*\.jst|js|test))/
    vendor: /^(bower_components|vendor)/
    app:/^client/
  modules: 
    nameCleaner: (path) -> path.replace /^client[\\\/](js[\\\/]|)/, ''
  plugins:
    cleancss:
      removeEmpty: true
      advanced: false # if this is not set then there is a little problem when it minifies the jqm vendor css
    less:
      dumpLineNumbers: 'comments' # other options: 'mediaquery', 'all'
    uglify: 
      mangle: true
      comments: 'all'
  server:
  	command: 'node ./stub_server/app.js'
  