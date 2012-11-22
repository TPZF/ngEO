/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDlManagersConfigData 
 */

module.exports = function(req, res){
  res.sendfile('./downloadManagers/downloadManagersConfigData.json');
};