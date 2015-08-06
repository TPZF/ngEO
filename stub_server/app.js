
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
  , hostedProcessDataAccessRequest = require('./hostedProcessDataAccessRequest')
  , standingOrderDataAccessRequest = require('./standingOrderDataAccessRequest')
  , downloadStatuses = require('./dataAccessRequestStatus')
  , downloadHelper = require('./downloadHelper')
  , shopcarts = require('./shopcarts')
  , datasetAuthorization = require('./datasetAuthorization')
  , hostedProcesses = require('./hostedProcesses')
  , user = require('./user')
  , http = require('http')
  , path = require('path')
  , httpProxy = require('http-proxy')
  , proxy = require('./proxy')
  , expressProxy = require('express-http-proxy')
  , url = require('url');

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
app.put('/ngeo/simpleDataAccessRequest', simpleDataAccessRequest);

//standing order DAR interface
app.put('/ngeo/standingOrderDataAccessRequest', standingOrderDataAccessRequest);

//hostedProcess DAR interface
app.put('/ngeo/hostedProcessDataAccessRequest', hostedProcessDataAccessRequest);

//data access statuses interface
app.get('/ngeo/dataAccessRequestStatus', downloadStatuses);

//data access statuses interface
app.post('/ngeo/dataAccessRequestStatus/:id', downloadStatuses);

//shopcarts list and shopcart content
app.get('/ngeo/shopcarts', shopcarts.list);
app.get('/ngeo/shopcarts/:id/search', shopcarts.getContent);

//create shopcart and add items interfaces
app.post('/ngeo/shopcarts', shopcarts.create);

//create shopcart and add items interfaces
app.post('/ngeo/shopcarts/:id/items', shopcarts.addItems);

//rename shopcart and update items interfaces
app.put('/ngeo/shopcarts/:id', shopcarts.put);

//delete shopcart and delete items of shopcart interfaces
app.delete('/ngeo/shopcarts/:id', shopcarts.deleteShopcart);

//delete shopcart and delete items of shopcart interfaces
app.delete('/ngeo/shopcarts/:id/items', shopcarts.deleteItems);

// get authorization
app.get('/ngeo/datasetAuthorization', datasetAuthorization);

//Hosted processing list
app.get('/ngeo/hostedProcesses', hostedProcesses);

// Basic user management
app.get('/ngeo/user/:id', user.change);

// user inquiry
app.post('/ngeo/userInquiry', function(req,res) {
	if (req.body.UserInquiry && req.body.UserInquiry.inquiryType && req.body.UserInquiry.inquiryText ) {
		res.send(200);
	} else {
		res.send(400);
	}
});

//download helper interface
app.get(/\/ngeo\/downloadHelper.*/, downloadHelper);

// Custom proxy
app.get('/proxy', function(req,res) {
  var parsed = url.parse(req.url.slice(req.url.indexOf("url=")+4));
  if ( parsed.path && parsed.host ) {
    req.url = parsed.path;
    expressProxy(parsed.host)(req,res);
  } else {
	// TODO: handle better error case
    res.send(500);
  }
});

// Setup some proxy route (to have access to WFS or GeoRSS services)
// TODO: use custom proxy instead
proxy.setup(app,[{ 
	'method': 'post',
	'host': 'demo.boundlessgeo.com',
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

/*
 * Didn't work actually due to TPZ firewall most likely, to be tested better..
 * <!> Need to update the version of http-proxy to 1.x instead of 0.8.0 <!>
 * 
 */
// Create a proxy server with custom application logic
//
// var p = httpProxy.createProxyServer({});

// //
// // Create your custom server and just call `proxy.web()` to proxy
// // a web request to the target passed in the options
// // also you can use `proxy.ws()` to proxy a websockets request
// //
// var proxyServer = http.createServer(function(req, res) {
//   // You can define here your custom logic to handle the request
//   // and then proxy the request.

//   var url = req.url.slice(req.url.indexOf("url=")+4);
//   p.web(req, res, {
//     target: url,
//     port: 80
//   });
// });
// proxyServer.listen(5050);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
