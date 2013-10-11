

  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

/**
  * Dataset authorizations  
   */
var DataSetAuthorizations = Backbone.Model.extend({
	
	defaults:{
		authorizations : null,
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetAuthorization';
	},

	// Parse the response
	parse: function(response){
				
		var authorizations = response.datasetAuthorizationInfo;
	
		return { 
			authorizations: response.datasetAuthorizationInfo
		};
	},

	// Check if a dataset has search access
	hasSearchAccess: function(datasetId) {
		var auth = _.findWhere( this.get('authorizations'), { datasetId: datasetId } );
		return auth ? auth.searchAccessGranted == "YES" : true;
	}

});

return new DataSetAuthorizations();

});