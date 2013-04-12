/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDataAccessReqConfigData
 */
 
var fs = require('fs');

module.exports = function(req, res){
 //if post request to change the status send back the DataAccessRequestStatus
 //and add a message
  //console.log(req.params.id);
  if (req.params.id){
	
	fs.readFile('./dataAccessRequestStatus/status.json', 'utf8', function (err, data) {
		var response = JSON.parse(data);
		response.dataAccessRequestStatus.ID = req.body.DataAccessRequestStatus.ID;
		response.dataAccessRequestStatus.status = req.body.DataAccessRequestStatus.status;
		res.send(response);
	 });
  }else{ 
	 res.sendfile('./dataAccessRequestStatus/statuses.json');
  }
 
  
};