/*
 * GET the validated download manager direct url
 * IF-ngEO-DownloadHelper 
 */

module.exports = function(req, res){

	var productURI = req.query.productURI;
	//check that the productURI parameter exists and that the url ends with .ngeo
	if (productURI && productURI.lastIndexOf('.ngeo') == productURI.length-5){
	  res.send('http://server.product.url.ngeo');
	}else{
		res.send('{"Exception" : {"code": 400,  "message": "Bad Fomatted request"}}');
	}
};