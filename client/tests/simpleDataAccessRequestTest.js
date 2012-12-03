define(['jquery', 'configuration', 'dataAccess/model/simpleDataAccessRequest', 'dataAccess/model/downloadManagers'], 
        function ($, Configuration, SimpleDataAccessRequest, DownloadManagers) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("SimpleDataAccessRequest", {
	    	setup: function() {
	
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done( function() {
	    				DownloadManagers.initialize();
	    		});
	    	}
	    });
    
	    QUnit.test("Check dataAccessRequest statuses in configuration", 3 , function () { 
	        QUnit.ok(Configuration.data.dataAccessRequestStatuses, "dataAccessRequestStatuses object found in configuration");
	    	QUnit.ok(Configuration.data.dataAccessRequestStatuses.validStatuses.validatedStatus.value == 4, "Validation status in configuration Ok");
	    	QUnit.ok(Configuration.data.dataAccessRequestStatuses.validStatuses.inProgressStatus.value == 0,"In progress status  in configuration Ok");
	    });

    
    	QUnit.asyncTest("Create Simple DAR & Assign a downloadManager", 8, function () {
    	
			DownloadManagers.fetch().done(function() {
				
				SimpleDataAccessRequest.initialize();
				SimpleDataAccessRequest.setProductURLs([{"ProductUrl" : "http:/server/test.ngeo"}]);
				SimpleDataAccessRequest.setDownloadManager(DownloadManagers.attributes.downloadmanagers[0].downloadmanagerid);
		
				QUnit.equal(SimpleDataAccessRequest.currentRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId, 
				DownloadManagers.attributes.downloadmanagers[0].downloadmanagerid, "a download manager is assigned to the request");
		
				QUnit.ok(SimpleDataAccessRequest.currentRequest.SimpleDataAccessRequest.productURLs.length == 1, "Product urls set to the request");
				
				QUnit.equal(SimpleDataAccessRequest.currentRequest.SimpleDataAccessRequest.requestStage, 
						"validation",  "Request Stage Validation");	
				
				//submit validation request
				SimpleDataAccessRequest.submit().done(function() {
				
					//Check that the server has returned the id of the DAR
					QUnit.ok(true, "Validation Request Submitted to the server");
					//Check that the server has returned the id of the DAR
					QUnit.equal(SimpleDataAccessRequest.id , "DAR_00000011092", "Request Submitted : DAR ID returned by the server");
					
					QUnit.equal(SimpleDataAccessRequest.currentRequest.SimpleDataAccessRequest.requestStage, 
							"confirmation",  "Request Stage Changed to Confirmation");
					
					QUnit.equal(SimpleDataAccessRequest.serverResponse, 
							"<p>Request Acknowledged<p><p> Estimated Size : 4000" + 
							"<p><p>Data Access Request validated<p>",  "Validation Server Response Ok");
				
				});
				
				//submit confirmation request
				SimpleDataAccessRequest.submit().done(function() {
					
					QUnit.ok(true, "Confirmation Request Submitted to the server");
//						QUnit.equal(SimpleDataAccessRequest.serverResponse, 
//								"<p>Request In Process...<p><p>processing<p>",  "Confirmation Server Response Ok");
					
				});
				
				QUnit.start();
			});		
				
		});
});