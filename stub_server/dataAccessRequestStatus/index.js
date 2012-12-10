/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDataAccessReqConfigData
 */

module.exports = function(req, res){
 //if post request to change the status with the DAR id
  if (req.params[0]){
	  console.log(req.body);
	  res.sendfile('{ "message" : "the DAR status has been changed"}');
  }else{ 
	 res.sendfile('./dataAccessRequestStatus/statuses.json');
  }
 
  
};