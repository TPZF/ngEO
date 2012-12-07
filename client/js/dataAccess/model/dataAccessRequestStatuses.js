/**
  * Data Access Request Statuses model 
  * It is a singleton which retrieves the all DARs statuses : used for DAR monitoring 
  */

define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DataAccessRequestStatuses = Backbone.Model.extend({
	
	defaults:{
		dataAccessRequestStatuses : []
	},

	initialize : function(){
		// The base url to retrieve the DARs'statuses list
		this.url = Configuration.baseServerUrl + '/dataAccessRequestStatus';
	}
});

return new DataAccessRequestStatuses();

});