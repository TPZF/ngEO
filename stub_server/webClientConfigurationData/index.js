
/*
 * GET WebClientConfigurationData
 * IF-ngEO-WebClientConfigurationData
 */
//var fs = require('fs');

module.exports = function(req, res){
  res.sendfile('./webClientConfigurationData/configuration.json');
};