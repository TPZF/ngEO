/*
 * IF-ngEO-simpleDatasetAccessRequest
 */

var fs = require('fs');

module.exports = function(req, res){

	if (req.body.SimpleDataAccessRequest.requestStage == "validation"){
	
		fs.readFile('./simpleDataAccessRequest/validationResponse.json', 'utf8', function (err, data) {
			var response = JSON.parse(data);
			console.log(req.data);
			response.DataAccessRequestStatus.dlManagerId = req.body.SimpleDataAccessRequest.downloadLocation.DownloadManagerId;
			response.DataAccessRequestStatus.productStatuses.length = req.body.SimpleDataAccessRequest.productURLs.length;
			res.send(response);
		});
		
	
	} else if (req.body.SimpleDataAccessRequest.requestStage == "confirmation"){
		res.sendfile('./simpleDataAccessRequest/confirmationResponse.json');
	
	} else {
		res.send({"error" : "invalid request stage"});
	}
};