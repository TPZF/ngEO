/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDataAccessReqConfigData
 */

module.exports = function(req, res){
 //if post request to change the status send back the DataAccessRequestStatus
 //and add a message
  //console.log(req.params.id);
  if (req.params.id){
	  var status = req.body;
	  status.DataAccessRequestStatus.message = "OK";
	  res.send(status);
  }else{ 
	 res.sendfile('./dataAccessRequestStatus/statuses.json');
  }
 
  
};