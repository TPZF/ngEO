/*
 * GET datasetAuthorization
 * IF-ngEO-DatasetAuthorization
 */

var user = require('../user');
 
module.exports = function(req, res){
  res.sendfile('./datasetAuthorization/datasets-' + user.getId() + '.json');
};