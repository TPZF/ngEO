  
define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/dataAccessRequest', 'search/model/datasetSearch'], 
		function($, Backbone, Configuration, DataAccessRequest, DatasetSearch) {

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

/**
 * This module deals with the creation and submission of a Standing order data access request
 * It extends DataAccessRequest module.
 */
var StandingOrderDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/standingOrderDataAccessRequest",

	OpenSearchURL : "",
	
	startDate : new Date(), 
	
	endDate : new Date( new Date().getTime() + ONE_MONTH ),
	
	timeDriven : false,
	
	repeatPeriod : 0,
	
	slideAcquisitionTime : false,
	
	DownloadOptions: {}, 
	
	SchedulingOptions : {},
	
	resetRequest : function (){
		
		this.OpenSearchURL = "";
		this.DownloadOptions = {};
		this.SchedulingOptions = {};
		this.hostedProcessId = null;
		
	},
	
	/** build the request to submit */
	getRequest : function() {

		var request = {
				StandingOrderDataAccessRequest : {
					requestStage :  this.requestStage,
					OpenSearchURL : this.OpenSearchURL,
					DownloadOptions : this.DownloadOptions,
					SchedulingOptions : this.getSchedulingOptions(),
					downloadLocation : this.downloadLocation,
				}
			};
		
		// Add hosted processing parameters if defined
		if ( this.hostedProcessId )
		{
			request.StandingOrderDataAccessRequest.hostedProcessId = this.hostedProcessId;
			request.StandingOrderDataAccessRequest.parameter = this.parameters;
		}

		//if createBulkOrder is set to true after a validation request
		//take into account the createBulkOrder for the confirmation request
		if (self.createBulkOrder){
			request.StandingOrderDataAccessRequest.createBulkOrder = true;
		}
		
		console.log(request);
		return  request;
	},
	
	/** the shared standing order url contains :
	 * 	1- all the search parameters as for as for a shared  search url. 
	 *  2- scheduling options parameters relative to a standing order request
	 */
	getSharedURL : function(searchCriteria){

		var url = "#data-services-area/sto/" +  searchCriteria.dataset.get("datasetId") + '?';
		
		//add area criteria 
		url += searchCriteria.searchArea.getOpenSearchParameter();

		//always add the advanced criteria values selected and already set to the model
		url = searchCriteria.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		url = searchCriteria.addDownloadOptions(url);
		
		//get the scheduling object either the STO is TimeDriven or Data-Driven
		var options = this.timeDriven ? this.getSchedulingOptions().TimeDriven : this.getSchedulingOptions().DataDriven;
		url += "&" + $.param(options);
		
		return url;
	},
	
	/** Method used in the case of a shared standing order url.
	 * It fill in the STO request with the given values.
	 */
	populateModelfromURL : function(query, dataset){
		
		this.initialize();
		
		var vars = query.split("&");
		
	    for (var i = 0; i < vars.length; i++) {
	        
	    	var pair = vars[i].split("=");
	    		
			switch (pair[0]) {
				
			case "startDate": 
				this.startDate = Date.fromISOString(pair[1]);
				break;
			case "endDate" : 
				this.endDate = Date.fromISOString(pair[1]);
				break;
			case "repeatPeriod": 
				this.repeatPeriod = pair[1];
				this.timeDriven = true;
				break;
			case "slideAcquisitionTime" : 
				this.slideAcquisitionTime = (pair[1]=="true"); //set boolean value not the string !
				this.timeDriven = true;
				break;
				
			default :
				break;
	    	}
	    }
	    
		//set open search url
	    this.OpenSearchURL = dataset.getOpenSearchURL();
		//set selected download options
	    this.DownloadOptions = dataset.getSelectedDownloadOptions();
	},
	
	/** build the Scheduling option property depending on the STO type */
	getSchedulingOptions : function (){
		
		if (this.timeDriven){
			
			return { TimeDriven : { 
				startDate : this.startDate.toISODateString(),
				endDate : this.endDate.toISODateString(),
				repeatPeriod : this.repeatPeriod, 
				slideAcquisitionTime : this.slideAcquisitionTime 
				} 
			};

		}else{
			return { DataDriven : { 
				startDate : this.startDate.toISODateString(),
				endDate : this.endDate.toISODateString()
			} };
		}
	},
	
	/** message to display as information 
	 * Display nothing for STO */
	getSpecificMessage : function(){
		
//		var collapsibleContent = "<h5> Standing Order info <h5>";
//		
//		collapsibleContent += "<p> OpenSearchURL: " + this.OpenSearchURL + "<p>";
//		
//		if (this.DownloadOptions === {} ){
//			collapsibleContent += "<p> There are no download Options <p>";
//		
//		}else{	
//
//			_.each(this.DownloadOptions, function(value, key){
//				collapsibleContent += "<p>" + value + " : " + key + "<p>";
//			});
//		}
//		
//		return collapsibleContent; 
	},
	
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.localConfig.dataAccessRequestStatuses;
		var standingOrderConfig = Configuration.localConfig.standingOrder;
		
		//if request not valid when no download manager then display the specific message
		//the validate button is not disabled since when the user selects a download manager the request
		if (this.downloadLocation.DownloadManagerId == ""){
			this.serverResponse = dataAccessConfig.invalidDownloadManagersError;
			return false;
		}
		
		if (this.OpenSearchURL == "" || !this.OpenSearchURL){
			this.serverResponse = standingOrderConfig.invalidOpenSearchURLError;
			return false;
		}

		if (!this.DownloadOptions){
			this.serverResponse = standingOrderConfig.invalidDownloadOptionsError;
			return false;
		}
	
		var computedShedulingOptions = this.getSchedulingOptions();		
		
		//initial request : nominal case
		//slideAcquisitionTime is a boolean and repeatPeriod is number so compare with undefined
		//to avoid 0/boolean false tests 
		if (this.step == 0 && 
		    this.id == "" &&
		    this.requestStage == dataAccessConfig.validationRequestStage && 
		    this.OpenSearchURL && this.DownloadOptions && 
		    this.SchedulingOptions && 
		    ((computedShedulingOptions.DataDriven && computedShedulingOptions.DataDriven.endDate) ||
		     (computedShedulingOptions.TimeDriven && computedShedulingOptions.TimeDriven.endDate &&
		    		 computedShedulingOptions.TimeDriven.repeatPeriod != undefined &&  
		    		 computedShedulingOptions.TimeDriven.slideAcquisitionTime != undefined))) {
			return true;
		}
	
		//second stage submission with and without bulk order
		//no need to test the other properties because they cannot be changed in the meantime
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage
		 ){
			return true;
		}

		//disable the request validation if the request is not valid
		this.trigger('RequestNotValidEvent');
		
		return false;
	},
		
	/** specific Standing order additional processing after validation request */
	validationProcessing : function (dataAccessRequestStatus){
		//there is nothing specific for standing orders
	}
	
}

//add DataAccessRequest methods to StandingOrderDataAccessRequest
_.extend(StandingOrderDataAccessRequest, DataAccessRequest);

return StandingOrderDataAccessRequest;

});