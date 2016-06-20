/*
 * GET datasetPopulationMatrix
 * IF-ngEO-DatasetSearchInfo
 */

module.exports = function(req, res){

	// Id could contain a '/' so pass by regexp
	var id = req.params[0];
	if ( id.match('test') || id == "ND_OPT_1/2" ) {
		res.sendfile('./datasetSearchInfo/ND_OPT_1_datasetInfo.json');
	} else {
		res.sendfile('./datasetSearchInfo/' + id + '_datasetInfo.json');
	}
};
