/*
 * IF-ngEO-enhancedDataAccessRequest
 */
 
var fs = require('fs');

module.exports = function(req, res){

	if (req.body.hostedProcessDataAccessRequest.requestStage == "validation"){
	
		fs.readFile('./simpleDataAccessRequest/validationResponse.json', 'utf8', function (err, data) {
			var response = JSON.parse(data);
			response.dataAccessRequestStatus.dlManagerId = req.body.hostedProcessDataAccessRequest.downloadLocation.DownloadManagerId;
			
			res.send(response);
		});
		
	
	} else if (req.body.hostedProcessDataAccessRequest.requestStage == "confirmation"){
		res.sendfile('./simpleDataAccessRequest/confirmationResponse.json');
	
	} else {
		res.send({"error" : "invalid request stage"});
	}
};