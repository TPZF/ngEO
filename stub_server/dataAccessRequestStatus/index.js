/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDataAccessReqConfigData
 */

module.exports = function(req, res){
  res.sendfile('./dataAccessRequestStatus/statuses.json');
};