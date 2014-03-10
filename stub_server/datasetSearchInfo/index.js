/*
 * GET datasetPopulationMatrix
 * IF-ngEO-DatasetSearchInfo
 */

module.exports = function(req, res){

	if ( req.params.id.match('test') ) {
		res.sendfile('./datasetSearchInfo/ND_OPT_1_datasetInfo.json');
	} else {
		res.sendfile('./datasetSearchInfo/' + req.params.id + '_datasetInfo.json');
	}
};
