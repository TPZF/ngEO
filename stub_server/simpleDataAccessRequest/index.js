/*
 * IF-ngEO-simpleDatasetAccessRequest
 */

var fs = require('fs');

module.exports = function(req, res){

	setTimeout( function() {
		if (req.body.SimpleDataAccessRequest.requestStage == "validation"){
		
			fs.readFile('./simpleDataAccessRequest/validationResponse.json', 'utf8', function (err, data) {
				var response = JSON.parse(data);
				console.log(req.data);
				response.dataAccessRequestStatus.dlManagerId = req.body.SimpleDataAccessRequest.downloadLocation.DownloadManagerId;
				
				//add as many blocks to the response as the numbers of requested products
				for (var i=0; i<req.body.SimpleDataAccessRequest.productURLs.length-1;i++){
					response.dataAccessRequestStatus.productStatuses.push(response.dataAccessRequestStatus.productStatuses[0]);
				}
				res.send(response);
			});
			
		
		} else if (req.body.SimpleDataAccessRequest.requestStage == "confirmation"){
			res.sendfile('./simpleDataAccessRequest/confirmationResponse.json');
		
		} else {
			res.send({"error" : "invalid request stage"});
		}
	}, 1000 );
};