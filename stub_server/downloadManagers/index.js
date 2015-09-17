/*
 * GET download managers list
 * GET the response for a download manager status change
 * GET the download manager installer
 * 
 * IF-ngEO-UserDlManagersConfigData 
 */

var user = require('../user');
var logger = require('../utils/logger');

module.exports = {
  	
  	/**
  	 *	List the available download managers
  	 */
	list: function(req, res) {
 		// Error case (used for test purpose)
		//res.status(404).sendfile('./downloadManagers/downloadManagersConfig-error.json');

		// Success case
		res.sendfile('./downloadManagers/downloadManagersConfig-' + user.getId() + '.json');
	},

	/**
	 *	Change status of download manager
	 *	Currently handles only STOP and STOP_IMMEDIATELY statuses
	 *	TODO: handle other statuses if needed
	 */
	changeStatus: function(req, res) {
		if (req.query.new_status == "STOP" || req.query.new_status == "STOP_IMMEDIATELY"){
			// Stop request
			res.sendfile('./downloadManagers/downloadManagerDisableResponse.json');
		}
	},

	/**
	 *	Download the installer
	 */
	downloadInstaller: function(req, res) {
		logger.debug("Download installer " + req.params.id);
		// Send a fake file just for simulation
		res.sendfile('./downloadManagers/downloadManagerDisableResponse.json');
	}
};