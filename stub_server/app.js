
/**
 * Module dependencies.
 */

// Change the working directory
process.chdir(__dirname);

var express = require('express')
  , webClientConfigurationData = require('./webClientConfigurationData')
  , datasetPopulationMatrix = require('./datasetPopulationMatrix')
  , datasetSearchInfo = require('./datasetSearchInfo')
  , productSearch = require('./productSearch')
  , downloadManagers = require('./downloadManagers')
  , simpleDataAccessRequest = require('./simpleDataAccessRequest')
  , standingOrderDataAccessRequest = require('./standingOrderDataAccessRequest')
  , downloadStatuses = require('./dataAccessRequestStatus')
  , downloadHelper = require('./downloadHelper')
  , shopcarts = require('./shopcarts')
  , hostedProcesses = require('./hostedProcesses')
  , http = require('http')
  , path = require('path')
  , httpProxy = require('http-proxy')
  , proxy = require('./proxy');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/client-dev',express.static(path.join(__dirname, '../client')));
  app.use('/client-opt',express.static(path.join(__dirname, '../build/output')));
  app.use('/client',express.static(path.join(__dirname, '../webclient')));
  app.use('/ngeo/files',express.static(path.join(__dirname, 'files')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// WebClientConfigurationData interface
app.get('/ngeo/webClientConfigurationData', webClientConfigurationData);

//datasetPopulationMatrix interface
app.get('/ngeo/datasetPopulationMatrix', datasetPopulationMatrix);

//datasetSearchInfo interface
app.get('/ngeo/datasetSearchInfo/:id', datasetSearchInfo);

//product search interface
app.get('/ngeo/catalogue/:datasetId/search', productSearch);

//download managers and download manager status change interfaces 
app.get(/\/ngeo\/downloadManagers.*/, downloadManagers);

//simple DAR interface
app.post('/ngeo/simpleDataAccessRequest', simpleDataAccessRequest);

//standing order DAR interface
app.post('/ngeo/standingOrderDataAccessRequest', standingOrderDataAccessRequest);

//data access statuses interface
app.get('/ngeo/dataAccessRequestStatus', downloadStatuses);

//data access statuses interface
app.post('/ngeo/dataAccessRequestStatus/:id', downloadStatuses);

//shopcarts list and shopcart content
app.get('/ngeo/shopcarts/:id?/:format?', shopcarts.get);

//create shopcart and add items interfaces
app.post('/ngeo/shopcarts/:id?', shopcarts.post);

//rename shopcart and update items interfaces
app.put('/ngeo/shopcarts/:id', shopcarts.put);

//commented shopcart items update
//app.put('/ngeo/shopcarts/:id(/items)?', shopcarts.put)

//delete shopcart and delete items of shopcart interfaces
app.delete('/ngeo/shopcarts/:id', shopcarts.delete);

//delete shopcart and delete items of shopcart interfaces
app.delete('/ngeo/shopcarts/:id/items', shopcarts.delete);

//Hosted processing list
app.get('/ngeo/hostedProcesses', hostedProcesses);

// user inquiry
app.post('/ngeo/userInquiry', function(req,res) {
	if (req.body.inquiryType && req.body.inquiryText ) {
		res.send(200);
	} else {
		res.send(400);
	}
});

//download helper interface
app.get(/\/ngeo\/downloadHelper.*/, downloadHelper);

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
}]);
	
var wms2eosProxy = httpProxy.createServer(80, 'wms2eos.eo.esa.int');
app.use('/wms2eos', wms2eosProxy);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
