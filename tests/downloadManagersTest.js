define(['jquery','dataAccess/model/downloadManagers'], function ($, DownloadManagers) {

	// Define the QUnit module and lifecycle.
	QUnit.module("DownloadManagers");
	
	//load the datasets 
	QUnit.asyncTest("Check Received DownloadManagers", 8, function () {
		DownloadManagers.initialize();
		DownloadManagers.fetch().done( function() {
			
			var downloadmanagers = DownloadManagers.attributes.downloadmanagers;
			QUnit.ok($.isArray(downloadmanagers),"Download Managers list retrieved");
			
			//check the criteria 
			QUnit.ok(downloadmanagers[0].downloadmanagerid ,"Download Manager ID found");
			QUnit.ok(downloadmanagers[0].downloadmanagerfriendlyname ,"Download Manager friendly name found");
			QUnit.ok(downloadmanagers[0].userid ,"Download Manager user ID found");
			QUnit.ok(downloadmanagers[0].status == 'ACTIVE',"Download Manager status found");
			QUnit.ok(downloadmanagers[0].ipaddress ,"Download Manager ipaddress found");
			QUnit.ok(downloadmanagers[0].lastaccessdate ,"Download Manager lastaccessdate found");
			
			//test DM change request status 
			DownloadManagers.requestChangeStatus(downloadmanagers[0].downloadmanagerid, 'INACTIVE').done(function(){
				QUnit.ok(downloadmanagers[0].status == 'INACTIVE', "changed DM from ACTIVE to INACTIVE");
				QUnit.start();
			});
				
		});
	});

});