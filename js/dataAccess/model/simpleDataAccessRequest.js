  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var SimpleDataAccessRequest = {
		

	url : Configuration.baseServerUrl + "/simpleDataAccessRequest",
	
	//TODO the DownloadDirectory is optional. Not taken into account for the moment
	request : {
			SimpleDataAccessRequest : {
				requestStage : "validation",
				downloadLocation : {DownloadManagerId : "" , DownloadDirectory : ""}, 
				productURLs : []
			}
	},
	 
	serverResponse : "TODO finish the server interface",

	
	/** Set the list of checked products */
	setProductURLs: function(urls){
		this.request.SimpleDataAccessRequest.productURLs = urls;
	},
	
	/** Assign the download manager to the request */
	setDownloadManager : function(downloadManagerId){
		this.request.SimpleDataAccessRequest.downloadLocation.DownloadManagerId = downloadManagerId;
	},
	
	/** Submit the request to the server */
	validate : function(){
		
//		console.log(this.request);
//		console.log(JSON.stringify(this.request));
		
		//TODO VALIDATE THE REQUEST
		
		var self = this;
		
		return $.ajax({
		  url: self.url,
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify(self.request),
		  success: function(data) {
			  console.log(" Received simple DAR validation response from the server...");
			  console.log("simple DAR validation response : ");
			  console.log (data);
			  
			  //check that the request has been acknowledged by the server
			  if (data.DataAccessRequestStatus.status == 4){
				   serverResponse = data.DataAccessRequestStatus.message;
			  }
			  self.serverResponse = "the response from the server is not expected";
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			  console.log("ERROR when posting DAR :" + textStatus + ' ' + errorThrown);
			  self.serverResponse =  "An error occured on the server";
		  }
		});	
	}
	  
}

return SimpleDataAccessRequest;

});