
/**
 * Module dependencies.
 */

var express = require('express')
  , webClientConfigurationData = require('./webClientConfigurationData')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/client',express.static(path.join(__dirname, '../client')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/server/webClientConfigurationData', webClientConfigurationData);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
