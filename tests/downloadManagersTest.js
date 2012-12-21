define(['jquery','dataAccess/model/downloadManagers'], function ($, DownloadManagers) {

	// Define the QUnit module and lifecycle.
	QUnit.module("DownloadManagers");
	
	//load the datasets 
	QUnit.asyncTest("Check & Monitor DownloadManagers", 14, function () {
		
		DownloadManagers.initialize();
		
		DownloadManagers.fetch().done( function() {
			
			var downloadmanagers = DownloadManagers.attributes.downloadmanagers;
			var commands = DownloadManagers.attributes.commands;
			QUnit.ok($.isArray(downloadmanagers),"Download Managers list retrieved");
			
			//check the criteria 
			QUnit.ok(downloadmanagers[0].downloadmanagerid ,"Download Manager ID found");
			QUnit.ok(downloadmanagers[0].downloadmanagerfriendlyname ,"Download Manager friendly name found");
			QUnit.ok(downloadmanagers[0].userid ,"Download Manager user ID found");
			QUnit.ok(downloadmanagers[0].status == 'ACTIVE', "DM_01 is ACTIVE");
			QUnit.ok(downloadmanagers[0].ipaddress ,"Download Manager ipaddress found");
			QUnit.ok(downloadmanagers[0].lastaccessdate ,"Download Manager lastaccessdate found");
			
			QUnit.ok(downloadmanagers[0].status == 'ACTIVE', " DM_01 is ACTIVE");
			QUnit.ok(downloadmanagers[1].status == 'INACTIVE', " DM_02 is INACTIVE");
			QUnit.ok(downloadmanagers[2].status == 'STOPPED', " DM_03 is STOPPED");
			
			//test DM change request status 
			DownloadManagers.requestChangeStatus(downloadmanagers[0].downloadmanagerid, 'STOP').done(function(){
				QUnit.ok(downloadmanagers[0].status == 'ACTIVE', "Status not changed immediately after a stop command");
				QUnit.ok(commands[0] == 'STOP', "submitted stop command");
				
				//test DM change request status 
				DownloadManagers.requestChangeStatus(downloadmanagers[1].downloadmanagerid, 'STOP_IMMEDIALETY').done(function(){
					QUnit.ok(downloadmanagers[1].status == 'INACTIVE', "submitted STOP_IMMEDIALETY command");
					QUnit.ok(commands[1] == 'STOP_IMMEDIALETY', "submitted stop immediately command");
					QUnit.start();
				});
				
			});
		
			
		});
	});

});