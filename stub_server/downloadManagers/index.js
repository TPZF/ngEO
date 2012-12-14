/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserDlManagersConfigData 
 */

module.exports = function(req, res){
  
	if (req.query.new_status == "ACTIVE"){ //it is a DM enable request
	
		res.sendfile('./downloadManagers/downloadManagerEnableResponse.json');
	
	}else if (req.query.new_status == "INACTIVE") {//it is a DM disable request
		
		res.sendfile('./downloadManagers/downloadManagerDisableResponse.json');

	} else{
		
		res.sendfile('./downloadManagers/downloadManagersConfigData.json');	
	}
};