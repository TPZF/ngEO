/*
 * IF-ngEO-simpleDatasetAccessRequest
 */

module.exports = function(req, res){

	if(req.body.SimpleDataAccessRequest.requestStage == "validation"){
		res.sendfile('./simpleDataAccessRequest/validationResponse.json');
	
	}else if (req.body.SimpleDataAccessRequest.requestStage == "confirmation"){
		res.sendfile('./simpleDataAccessRequest/confirmationResponse.json');
	
	}else{
		res.send({"error" : "invalid request stage"});
	}
};