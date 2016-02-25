var Configuration = require('configuration');
var DownloadManagers;
var DataAccessRequestStatuses;

describe("DataAccessRequestStatuses test", function() {

	beforeEach(function(done) {
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		// Load configuration
		Configuration.load().done(function() {
			done();
		})

		DownloadManagers = require('dataAccess/model/downloadManagers');
		DataAccessRequestStatuses = require('account/model/dataAccessRequestStatuses');
	});

	it("initialize the download managers", function(done) {
		expect(DownloadManagers.initialize).toBeDefined();
		DownloadManagers.initialize();
		DownloadManagers.fetch().done(function() {
			done();
		});
	});

	it("should be able to initialize", function(){
		DataAccessRequestStatuses.initialize({
			collapseDAR: Configuration.data.dataAccessRequestStatuses.collapseDAR,
			collapseProducts: Configuration.data.dataAccessRequestStatuses.collapseProducts
		});
	});

	it("should be able to fetch the statuses", function(){
		DataAccessRequestStatuses.set(__fixtures__["stub_server/dataAccessRequestStatus/statuses"]);
		// Check all the statuses
		var statuses = DataAccessRequestStatuses.attributes.dataAccessRequestStatuses;
		expect($.isArray(statuses)).toBe(true);
		expect(statuses.length).toEqual(7);

		// Check single status
		var status = statuses[0];
		expect(status.ID).toBe("DAR_00000011075");
		expect(status.name).toBe("Friendly name");
		expect(status.status).toEqual(0);
		expect(status.type).toBe("Simple Data Access Request");
		expect(status.dlManagerId).toBe("DM_01");
	});

	it("should be able to order statuses", function(){
		var orderedStatauses = DataAccessRequestStatuses.getOrderedStatuses();
		expect($.isArray(orderedStatauses)).toBe(true);
		expect(orderedStatauses.length).toEqual(2);

		var status = orderedStatauses[0];
		expect(status.downloadManagerName).toBe("Magellium Limited Main DM 1");
		expect(status.dlManagerId).toBe("DM_01");
		expect(status.DARs.length).toEqual(3);
		// TODO: add more..
	});

	it("should be able to filter statuses", function() {
		// Test the filtered statuses according to DM_01
		var filtredStatuses = DataAccessRequestStatuses.getFilterOrderedStatuses('DM_01');
		expect($.isArray(filtredStatuses)).toBe(true);
		expect(filtredStatuses.length).toEqual(1);
		var filtredStatus = filtredStatuses[0];
		expect(filtredStatus.downloadManagerName).toBe("Magellium Limited Main DM 1");
		expect(filtredStatus.dlManagerId).toBe('DM_01');
		expect(filtredStatus.DARs.length).toEqual(3);
	
		// Test the filtered statuses according to DM_02
		filtredStatuses = DataAccessRequestStatuses.getFilterOrderedStatuses('DM_02');
		expect($.isArray(filtredStatuses)).toBe(true);
		expect(filtredStatuses.length).toEqual(1);
		var filtredStatus = filtredStatuses[0];
		expect(filtredStatus.downloadManagerName).toBe("TPZ Limited Main DM 2");
		expect(filtredStatus.dlManagerId).toBe('DM_02');
		expect(filtredStatus.DARs.length).toEqual(4);
	
	});

});