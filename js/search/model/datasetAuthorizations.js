

  
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
				
		return { 
			authorizations: response.datasetAuthorisationInfo
		};
	},

	// Check if a dataset has search access
	hasSearchAccess: function(datasetId) {
		var auth = _.findWhere( this.get('authorizations'), { datasetId: datasetId } );
		return auth ? auth.searchAccessGranted == "YES" : true;
	},

	// Check if a dataset has download access
	hasDownloadAccess: function(datasetId) {
		var auth = _.findWhere( this.get('authorizations'), { datasetId: datasetId } );
		return auth ? auth.downloadAccessGranted == "YES" : true;
	},
	
	// Check if a dataset has view access
	hasViewAccess: function(datasetId) {
		var auth = _.findWhere( this.get('authorizations'), { datasetId: datasetId } );
		if (!auth) {
			return true;
		}
		var broweLayerAuthorizations = auth.browseLayerAuthorizations;
		if (!broweLayerAuthorizations || !_.isArray(broweLayerAuthorizations)) {
			return true;
		}
		
		var viewAccess = true;
		for ( var i = 0; i < broweLayerAuthorizations.length; i++ ) {
			viewAccess &= broweLayerAuthorizations[i].viewAccessGranted == "YES";
		}
		return viewAccess;
	}

});

return new DataSetAuthorizations();

});