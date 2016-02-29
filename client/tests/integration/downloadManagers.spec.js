var Configuration = require('configuration');
var DownloadManagers;

describe("Download Managers test", function() {

	beforeEach(function(done) {
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		// Load configuration
		Configuration.load().done(function() {
			done();
		})

		DownloadManagers = require('dataAccess/model/downloadManagers');
	});

	it("should be able to initialize", function(done) {
		expect(DownloadManagers.initialize).toBeDefined();
		DownloadManagers.initialize();
		DownloadManagers.fetch().done(function() {
			done();
		});
	});

	it("should be able to fetch", function(){
		var downloadmanagers = DownloadManagers.attributes.downloadmanagers;
		expect($.isArray(downloadmanagers)).toBe(true) //"Download Managers list retrieved"
		
		var dm = downloadmanagers[0];		
		// Check the criteria 
		expect(dm.downloadManagerId).toBe("DM_01");
		expect(dm.downloadManagerFriendlyName).toBe("Magellium Limited Main DM 1");
		expect(dm.userId).toBe("esa_user1");
		expect(dm.status).toBe('ACTIVE');
		expect(dm.ipAddress).toBe("dmServer.magellium.fr");
		expect(dm.lastAccessDate).toBe("2001-12-17T09:30:47-05:00");
		
		expect(dm.status == 'ACTIVE', " DM_01 is ACTIVE");
		expect(downloadmanagers[1].status).toBe('INACTIVE');
		expect(downloadmanagers[2].status).toBe('STOPPED');
		
		// Test DM change request status 
		DownloadManagers.requestChangeStatus(downloadmanagers[0].downloadManagerId, 'STOP').done(function() {
			expect(downloadmanagers[0].status).toBe('STOPPED');
		});
	});
});