/*
 * GET datasetPopulationMatrix
 * IF-ngEO-UserDataAccessReqConfigData
 */
 
var fs = require('fs'),
    find = require('lodash.find');

module.exports = function(req, res){
 //if post request to change the status send back the DataAccessRequestStatus
 //and add a message
  //console.log(req.params.id);
  if (req.params.id) {
	
	fs.readFile('./dataAccessRequestStatus/status.json', 'utf8', function (err, data) {
		var response = JSON.parse(data);
		response.dataAccessRequestStatus.ID = req.body.DataAccessRequestStatus.ID;
		response.dataAccessRequestStatus.status = req.body.DataAccessRequestStatus.status;
		res.send(response);
	});
  } else {

    if ( req.body.DarIdList ) {
        // Reassign dar download manager ids
        fs.readFile('./dataAccessRequestStatus/statuses.json', 'utf8', function (err, data) {
            var initialStatuses = JSON.parse(data);
            var response = [];
            for ( var i=0; i<req.body.DarIdList.length; i++ ) {
                var darId = req.body.DarIdList[i];
                var modifiedDar = find( initialStatuses.dataAccessRequestStatuses, function(status) {
                    return status.ID == darId;
                } );
                var dar = {
                    "id": modifiedDar.ID,
                    "name": "Friendly name " + modifiedDar.ID,
                    "type": modifiedDar.type,
                    "status": req.body.DataAccessRequestStatus.status,
                    "message": "status changed successfully",
                    "dlManagerId": req.body.DataAccessRequestStatus.dlManagerId
                }
                response.push(dar);
            }
            res.send(response);
        });
    } else {
        res.sendfile('./dataAccessRequestStatus/statuses.json');
    }

  }
 
  
};