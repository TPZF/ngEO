/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

module.exports = function(req, res){
  res.sendfile('./datasetPopulationMatrix/datasets.json');
};