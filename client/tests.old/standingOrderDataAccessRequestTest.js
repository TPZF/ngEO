define(['jquery', 'configuration', 'dataAccess/model/standingOrderDataAccessRequest', 'dataAccess/model/downloadManagers'], 
        function ($, Configuration, StandingOrderDataAccessRequest, DownloadManagers) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("standingOrderDataAccessRequest", {
	    	setup: function() {
	
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done( function() {
	    				DownloadManagers.initialize();
	    		});
	    	}
	    });
    
    	QUnit.asyncTest("Create Standing Order & Assign a downloadManager", 11, function () {
    	
			DownloadManagers.fetch().done(function() {
				
				StandingOrderDataAccessRequest.initialize();
				//No time for the moment
				//StandingOrderDataAccessRequest.OpenSearchURL = "http://localhost:3000/server/catalogueSearch/ND_OPT_1?start=2012-12-07&stop=2012-12-07&count=10&bbox=-15.5775,47.07669921875,12.5475,57.84330078125";
				StandingOrderDataAccessRequest.OpenSearchURL = "http://localhost:3000/server/catalogueSearch/ND_OPT_1?start=2012-12-07T09:34:00&stop=2012-12-07T09:34:00&count=10&bbox=-15.5775,47.07669921875,12.5475,57.84330078125";
				
				StandingOrderDataAccessRequest.endDate = new Date("2012-12-07");
				//StandingOrderDataAccessRequest.endTime = "10:34";
				StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId = DownloadManagers.attributes.downloadmanagers[0].downloadManagerId;
				
				QUnit.equal(StandingOrderDataAccessRequest.requestStage, 
						"validation",  "Request Stage Validation");	
				
				//submit validation request
				StandingOrderDataAccessRequest.submit().done(function() {
				
					QUnit.ok(StandingOrderDataAccessRequest.OpenSearchURL != "", "OpenSearch url set to the request");
					
					QUnit.ok(StandingOrderDataAccessRequest.DownloadOptions != undefined, "DownloadOptions set to the request");
					
					QUnit.ok(StandingOrderDataAccessRequest.getSchedulingOptions().DataDriven != undefined, "DataDriven SchedulingOptions set");
					
					//QUnit.equal(StandingOrderDataAccessRequest.getSchedulingOptions().DataDriven.endDate, "2012-12-07T10:34:00.00Z", "DataDriven endDate set");
					QUnit.equal(StandingOrderDataAccessRequest.getSchedulingOptions().DataDriven.endDate, "2012-12-07", "DataDriven endDate set");
					
					QUnit.equal(StandingOrderDataAccessRequest.requestStage, 
							"confirmation",  "Request Stage Validation");	
					
					QUnit.equal(StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId, 
							DownloadManagers.attributes.downloadmanagers[0].downloadManagerId, "a download manager is assigned to the request");
					
					//Check that the server has returned the id of the DAR
					QUnit.ok(true, "Validation Request Submitted to the server");
					
					QUnit.equal(StandingOrderDataAccessRequest.requestStage, 
							"confirmation",  "Request Stage Changed to Confirmation");				
				
					//submit confirmation request
					StandingOrderDataAccessRequest.submit().done(function() {
						
						QUnit.ok(true, "Confirmation Request Submitted to the server");

						QUnit.equal(StandingOrderDataAccessRequest.requestStage, 
								"confirmation",  "Request Stage Confirmation");	
						
						QUnit.start();
						
					});
					
				});
				
			});		
				
		});
});