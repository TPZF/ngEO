/*
 * GET the available hosted processing list 
 * 
 * IF-ngEO-HostedProcessingList
 */

module.exports = function(req, res){

	res.sendfile('./hostedProcesses/hostedProcessingList.json');
	
};