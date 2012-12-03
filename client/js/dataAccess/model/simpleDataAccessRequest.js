  
define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/dataAccessRequest'], 
		
		function($, Backbone, Configuration, DataAccessRequest) {

/**
 * This module deals with the creation and submission of simple data access requests 
 * It extends DataAccessRequest module
 */
var SimpleDataAccessRequest = {

	url : Configuration.baseServerUrl + "/simpleDataAccessRequest",
	
	rejectedProductsNB : 0, //nb of products checked but not having a url 
	
	productURLs : [],
	
	/** reset specific parameters of a simple DAR */
	resetRequest : function (){
		
		this.rejectedProductsNB = 0;
		this.productURLs = [];
	},
	
	/** get the current request to submit */
	getRequest : function() {	
		
		if (this.createBulkOrder){
			
			return {
				SimpleDataAccessRequest : {
					requestStage :  this.requestStage,
					createBulkOrder: true,
					downloadLocation : this.downloadLocation, 
					productURLs : this.productURLs
				}
			};
		}
		
		return {
			SimpleDataAccessRequest : {
				requestStage :  this.requestStage,
				downloadLocation : this.downloadLocation, 
				productURLs : this.productURLs
			}
		};
		
	},
	
	/** get message the display when a simple DAT creation is triggered */
	getSpecificMessage : function(){
		
		var collapsibleContent = "<h5>Selected Products : " + (this.productURLs.length + this.rejectedProductsNB) + "<h5>";
		
		if (this.rejectedProductsNB == 0){
			collapsibleContent += "<p>All the selected items have been included in the request.<p>";
		}else{
			collapsibleContent += "<p> " + this.rejectedProductsNB + " products were not included in the request since they do not have a url.";
		}
		
		return collapsibleContent; 
	},
	
	/** Set the list of products for the DAR 
	 * if the file name is empty the product is rejected
	 */
	setProducts: function(products) {
		
		for ( var i = 0; i < products.length; i++ ) {
			var eor = products[i].properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename!= "" ) {
				this.productURLs.push( eor.eop_ProductInformation.eop_filename );
			} else {
				this.rejectedProductsNB++;
			}
		}
	},
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.data.dataAccessRequestStatuses;

		//if request not valid when no download manager then display the specific message
		//the validate button is not disabled since when the user selects a download manager the request
		if (this.downloadLocation.DownloadManagerId == ""){
			this.serverResponse = dataAccessConfig.invalidDownloadManagersError;
			return false;
		}
		
		//Request not valid when no product urls set then display the specific message
		if ( this.productURLs.length == 0){
			this.serverResponse = Configuration.data.simpleDataAccess.invalidProductURLsError;
			this.trigger('toggleRequestButton', ['disable']);
			return false;
		}

		//second stage submission with and without bulk order if the user changes the download manager 
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage &&
		    (this.firstRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId != 
		    	this.downloadLocation.DownloadManagerId)) {
			
				this.serverResponse = dataAccessConfig.invalidConfirmationRequest;
				this.trigger('toggleRequestButton', ['disable']);
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
			this.requestStage == dataAccessConfig.confirmationRequestStage &&
		    (this.firstRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId ==
		    	this.downloadLocation.DownloadManagerId)
		 ){
			return true;
		}
		
		//disable the request validation if the request is not valid
		this.trigger('toggleRequestButton', ['disable']);
		
		return false;
	},
	
	/** save the validation request in order to proceed to confirmation*/
	keepFirstRequestMembers : function(){
		 this.firstRequest.SimpleDataAccessRequest.requestStage = this.requestStage;
		 this.firstRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId = this.downloadLocation.DownloadManagerId;
		 this.firstRequest.SimpleDataAccessRequest.downloadLocation.DownloadDirectory = this.downloadLocation.DownloadDirectory;
		 this.firstRequest.SimpleDataAccessRequest.productURLs = this.productURLs;
		 
	},
	
	/** specific simple DAR additional processing after validation request */
	validationProcessing : function(dataAccessRequestStatus){
		
		//calculate the total download estimated size  
		  var totalSize = 0;
		  _.each(dataAccessRequestStatus.productStatuses, function(productStatus){
			  totalSize += productStatus.expectedSize;
		  });
		  
		  this.serverResponse += "<p> Estimated Size : " + totalSize + "<p>";
	}
}

// add DataAccessRequest methods to SimpleDataAccessRequest
_.extend(SimpleDataAccessRequest, DataAccessRequest);

return SimpleDataAccessRequest;

});