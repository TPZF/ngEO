
/*
 * Basic proxy (used to acces WFS or GeoRSS feed)
 */

var httpProxy = require('http-proxy')
/*
app.post('/demoWFS', function(req, res) {
	req.url = '/geoserver/wfs';
	var buffer = httpProxy.buffer(req);
	proxy.proxyRequest(req, res, {
      port: 80,
      host: 'demo.opengeo.org',
      buffer: buffer
    });
});
*/

//http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml
/*var options = {
  host: 'earthquake.usgs.gov',
  port: 80,
  path: '/earthquakes/catalogs/eqs7day-M5.xml',
  method: 'GET'
};
var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});*/

exports.setup = function(app,routes){
	// Proxy
	var proxy = new httpProxy.RoutingProxy();

	routes.forEach( function(route) {
		if ( route.method == 'get' ) {
			app.get(route.pattern, function(req, res) {
				console.log(route.host + route.replace);
				req.url = route.replace;
				console.log(req);
				proxy.proxyRequest(req, res, {
				  port: 80,
				  host: route.host,
				});
			});
		} else if ( route.method == 'post' ) {
			app.post(route.pattern, function(req, res) {
				req.url = route.replace;
				var buffer = httpProxy.buffer(req);
				proxy.proxyRequest(req, res, {
				  port: 80,
				  host: route.host,
				  buffer: buffer
				});
			});
		}
	});
};