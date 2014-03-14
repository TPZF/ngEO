/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserDlManagersConfigData 
 */

var user = require('../user');

module.exports = function(req, res){
  
	if (req.query.new_status == "STOP" || req.query.new_status == "STOP_IMMEDIATELY"){ //stop request
	
		res.sendfile('./downloadManagers/downloadManagerDisableResponse.json');

	} else{
		
		res.sendfile('./downloadManagers/downloadManagersConfig-' + user.getId() + '.json');	
	}
};