/*
 * GET datasetPopulationMatrix
 * IF-ngEO-DatasetSearchInfo
 */

module.exports = function(req, res){
	
	switch (req.params.id) {
		case 'ND_SAR_1':
			res.sendfile('./datasetSearchInfo/ND_SAR_1_datasetInfo.json');
			break;
		case 'ND_S2_1':
			res.sendfile('./datasetSearchInfo/ND_S2_1_datasetInfo.json');
			break;
		case 'LD_SENTINEL_1':
			res.sendfile('./datasetSearchInfo/LD_SENTINEL_1_datasetInfo.json');
			break;
		case 'SENTINEL2_L1':
			res.sendfile('./datasetSearchInfo/SENTINEL2_L1_datasetInfo.json');
			break;
		case 'SENTINEL3':
			res.sendfile('./datasetSearchInfo/SENTINEL3_datasetInfo.json');
			break;
		case 'SENTINEL3_L1':
			res.sendfile('./datasetSearchInfo/SENTINEL3_L1_datasetInfo.json');
			break;
		case 'SENTINEL3_L2':
			res.sendfile('./datasetSearchInfo/SENTINEL3_L2_datasetInfo.json');
			break;
		default:
			res.sendfile('./datasetSearchInfo/datasetInfo.json');
			break;
	}
};
