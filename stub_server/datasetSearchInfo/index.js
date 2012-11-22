/*
 * GET datasetPopulationMatrix
 * IF-ngEO-DatasetSearchInfo
 */

module.exports = function(req, res){
  res.sendfile('./datasetSearchInfo/datasetInfo.json');
};