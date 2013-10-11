/*
 * GET datasetAuthorization
 * IF-ngEO-DatasetAuthorization
 */

module.exports = function(req, res){
  res.sendfile('./datasetAuthorization/datasets.json');
};