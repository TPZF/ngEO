
/**
 * Module dependencies.
 */

var express = require('express')
  , webClientConfigurationData = require('./webClientConfigurationData')
  , http = require('http')
  , path = require('path')
  , proxy = require('./proxy');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/client-dev',express.static(path.join(__dirname, '../client')));
  app.use('/client',express.static(path.join(__dirname, '../build/output')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// WebClientConfigurationData interface
app.get('/server/webClientConfigurationData', webClientConfigurationData);

// Setup some proxy route (to have access to WFS or GeoRSS services)
proxy.setup(app,[{ 
	'method': 'post',
	'host': 'demo.opengeo.org',
	'pattern': '/demoWFS',
	'replace': '/geoserver/wfs'
	}, {
	'method': 'get',
	'host': 'earthquake.usgs.gov',
	'pattern': '/demoFeed',
	'replace': '/earthquakes/catalogs/eqs7day-M5.xml'
	}
]);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
