  
define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults', 'dataAccess/model/dataAccessRequest'], 
		
		function($, Backbone, Configuration, SearchResults, DataAccessRequest) {

/**
 * This module deals with the creation and submission of simple data access requests 
 * It extends DataAccessRequest module
 */
var SimpleDataAccessRequest = {

	url : Configuration.baseServerUrl + "/simpleDataAccessRequest",
	
	rejectedProductsNB : 0, //nb of products checked but not having a url 
	
	productURLs : [],
	
	totalSize : 0,
	
	/** reset specific parameters of a simple DAR */
	resetRequest : function (){
		
		this.rejectedProductsNB = 0;
		this.productURLs = [];
	},
	
	/** get the current request to submit */
	getRequest : function() {

		// The JSON to send to the server
		var request = {
				SimpleDataAccessRequest : {
					requestStage :  this.requestStage,
					downloadLocation : this.downloadLocation, 
					productURLs : []
				}
			};
		
		// Add create bulk order if needed
		if (this.createBulkOrder){
			request.SimpleDataAccessRequest.createBulkOrder =  true;
		}
		
		// Transform product URLs
		for ( var i = 0; i < this.productURLs.length; i++ ) {
			request.SimpleDataAccessRequest.productURLs.push({
				productURL: this.productURLs[i]
			});
		}
		
		return request;	
	},
		
	/** get message the display when a simple DAT creation is triggered */
	getSpecificMessage : function(){
		
		var collapsibleContent = "<h5>Selected Products : " + (this.productURLs.length + this.rejectedProductsNB) + "<h5>";
		
		if (this.rejectedProductsNB == 0){
			collapsibleContent += "<p>All the selected items have been included in the request.<p>";
		}else{
			collapsibleContent += "<p> " + this.rejectedProductsNB + " products are not included in the request since they do not have a url.";
		}
		
		return collapsibleContent; 
	},
	
	
	/** Set the list of products for the DAR 
	 * if the file name is empty the product is rejected
	 */
	setProducts: function(products) {
		this.productURLs = SearchResults.getProductUrls(products);
		this.rejectedProductsNB = products.length - this.productURLs.length;
	},
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.localConfig.dataAccessRequestStatuses;

		//if request not valid when no download manager then display the specific message
		//the validate button is not disabled since when the user selects a download manager the request
		if (this.downloadLocation.DownloadManagerId == ""){
			this.serverResponse = dataAccessConfig.invalidDownloadManagersError;
			return false;
		}
		
		//Request not valid when no product urls set then display the specific message
		if ( this.productURLs.length == 0){
			this.serverResponse = Configuration.localConfig.simpleDataAccess.invalidProductURLsError;
			this.trigger('RequestNotValidEvent');
			return false;
		}
		
		//initial request : nominal case
		if (this.step == 0 && 
		    this.id == "" &&
		    this.requestStage == dataAccessConfig.validationRequestStage) {
			return true;
		}
		
		//second stage submission with and without bulk order
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage) {
			return true;
		}
		
		//disable the request validation if the request is not valid
		this.trigger('RequestNotValidEvent');
		
		return false;
	},
	
	/** specific simple DAR additional processing after validation request */
	validationProcessing : function(dataAccessRequestStatus){
		
		//calculate the total download estimated size  
		  this.totalSize = 0;
		  var productStatuses = dataAccessRequestStatus.productStatuses; 
		  for ( var i = 0; i < productStatuses.length; i++) {
			  this.totalSize += parseInt( productStatuses[i].expectedSize );
		  }
	}
}

// add DataAccessRequest methods to SimpleDataAccessRequest
_.extend(SimpleDataAccessRequest, DataAccessRequest);

return SimpleDataAccessRequest;

});