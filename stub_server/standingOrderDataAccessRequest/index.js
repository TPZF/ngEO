/*
 * IF-ngEO-standingOrderDataAccessRequest
 */

module.exports = function(req, res){

	if(req.body.SimpleDataAccessRequest.requestStage == "validation"){
		res.sendfile('./standingOrderDataAccessRequest/validationResponse.json');
	
	}else if (req.body.SimpleDataAccessRequest.requestStage == "confirmation"){
		res.sendfile('./standingOrderDataAccessRequest/confirmationResponse.json');
	
	}else{
		res.send({"error" : "invalid standingOrderDataAccessRequest stage"});
	}
};