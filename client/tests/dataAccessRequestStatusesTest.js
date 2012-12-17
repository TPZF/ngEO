define(['jquery', 'configuration', 'dataAccess/model/downloadManagers', 'dataAccess/model/dataAccessRequestStatuses'], 
		function ($, Configuration, DownloadManagers, DataAccessRequestStatuses) {

	// Define the QUnit module and lifecycle.
	QUnit.module("DataAccessRequestStatuses"); 
	
	//load the data Access Request Statuses 
	QUnit.asyncTest("Check Received DataAccessRequestStatuses", 26, function () {
		
//		Configuration.url = "../conf/configuration.json";
//		Configuration.load().done( function() {
//			
			DownloadManagers.initialize();
			DownloadManagers.fetch().done( function() {
			
				DataAccessRequestStatuses.initialize();
				DataAccessRequestStatuses.fetch().done( function() {
						
					var statuses = DataAccessRequestStatuses.attributes.dataAccessRequestStatuses;
					QUnit.ok($.isArray(statuses), "DataAccessRequestStatuses list retrieved");
					QUnit.ok(statuses.length == 7, "DataAccessRequestStatuses length OK");
					
					//check the criteria 
					QUnit.ok(statuses[0].ID ,"DataAccessRequestStatus ID found");
					QUnit.ok(statuses[0].status ,"DataAccessRequestStatus status found");
					QUnit.ok(statuses[0].type ,"DataAccessRequestStatus type found");
					QUnit.ok(statuses[0].dlManagerId ,"DataAccessRequestStatus assigned download manager ID found");
					
					//test the ordered statuses according to DMs 
					var orderedStatauses = DataAccessRequestStatuses.getOrderedStatuses();
					 
					QUnit.ok($.isArray(orderedStatauses),"Ordered Statuses with DM");
					QUnit.ok(orderedStatauses.length == 2,"Ordered Statuses length OK");
						
					//check the criteria 
					QUnit.ok(orderedStatauses[0].downloadManagerName ,"downloadManagerName found");
					QUnit.ok(orderedStatauses[0].dlManagerId ,"dlManagerId found");
					QUnit.ok(orderedStatauses[0].DARs ,"DARs list found");
					QUnit.ok(orderedStatauses[0].DARs.length == 3,"DARs length OK found");
					
					QUnit.ok(orderedStatauses[1].downloadManagerName ,"downloadManagerName found");
					QUnit.ok(orderedStatauses[1].dlManagerId ,"dlManagerId found");
					QUnit.ok(orderedStatauses[1].DARs ,"DARs list found");
					QUnit.ok(orderedStatauses[1].DARs.length == 4,"DARs length OK found");
					
					
					//test the filtered statuses according to DM_01
					var filtredStatuses = DataAccessRequestStatuses.getFilterOrderedStatuses('DM_01');
					 
					QUnit.ok($.isArray(filtredStatuses),"filtred Statuses with DM_01");
					QUnit.ok(filtredStatuses.length == 1,"filtred Statuses length OK");
					QUnit.ok(filtredStatuses[0].downloadManagerName == "Magellium Limited Main DM" ,"downloadManagerName DM_01 Ok");
					QUnit.ok(filtredStatuses[0].dlManagerId == 'DM_01' ,"dlManagerId DM_01 OK");
					QUnit.ok(filtredStatuses[0].DARs.length == 3,"DARs length OK");
				
					//test the filtered statuses according to DM_02
					filtredStatuses = DataAccessRequestStatuses.getFilterOrderedStatuses('DM_02');
					 
					QUnit.ok($.isArray(filtredStatuses),"filtred Statuses with DM_02");
					QUnit.ok(filtredStatuses.length == 1,"filtred Statuses length OK");	
					QUnit.ok(filtredStatuses[0].downloadManagerName == "TPZ Limited Main DM" ,"downloadManagerName DM_02 OK");
					QUnit.ok(filtredStatuses[0].dlManagerId == 'DM_02',"dlManagerId DM_02 OK");
					QUnit.ok(filtredStatuses[0].DARs.length == 4, "DARs for DM_02 length OK");
//					
				QUnit.start();
			});

	
			});
//
//		});
	});
});