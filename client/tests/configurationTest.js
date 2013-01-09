define(['configuration'], function (Configuration) {

    // Define the QUnit module and lifecycle.
    QUnit.module("Configuration");

    QUnit.asyncTest("Check map configuration", 11, function () {
		Configuration.url = "../conf/configuration.json";
		Configuration.load()
			.done( function() {
				var mapData = Configuration.data.map;
				QUnit.ok(mapData,"map object found in configuration");
				QUnit.ok($.isArray(mapData.layers),"layers found in map configuration");
				QUnit.ok($.isArray(mapData.backgroundLayers),"background layers found in map configuration");
				
				var dataAccessRequestStatuses = Configuration.localConfig.dataAccessRequestStatuses;
				QUnit.ok(dataAccessRequestStatuses,"dataAccessRequestStatuses object found in configuration");
				QUnit.ok(dataAccessRequestStatuses.validStatuses,"validStatuses found in configuration");
				
				QUnit.ok(dataAccessRequestStatuses.validStatuses.inProgressStatus.value == 0,"in progress status 0 OK");
				QUnit.ok(dataAccessRequestStatuses.validStatuses.pausedStatus.value == 1,"paused status 1 OK");
				QUnit.ok(dataAccessRequestStatuses.validStatuses.completedStatus.value == 2,"completed status 2 OK");
				QUnit.ok(dataAccessRequestStatuses.validStatuses.cancelledStatus.value == 3,"cancelled status 3 OK");
				QUnit.ok(dataAccessRequestStatuses.validStatuses.validatedStatus.value == 4,"validated status 4 OK");
				QUnit.ok(dataAccessRequestStatuses.validStatuses.bulkOrderStatus.value == 5,"Bulk order status 5 OK");
				
				QUnit.start();
			});
	});

});