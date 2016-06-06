var Configuration = require('configuration');
var SimpleDataAccessRequest;

describe("DataAccessRequest test", function() {

	var statusesConfig;
    beforeEach(function(done){
    	Configuration.url = "/client-dev/conf/"; // Use stub_server's url
    	// Load configuration
    	Configuration.load().done(function(){
    		// Use SimpleDataAccessRequest to check dar workflow
    		SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');
    		StandingOrderDataAccessRequest = require('dataAccess/model/standingOrderDataAccessRequest');
    		statusesConfig = Configuration.localConfig.dataAccessRequestStatuses;
    		done();
    	})
    });


    it("should be able to initialize", function() {
        expect(SimpleDataAccessRequest.initialize).toBeDefined();
        SimpleDataAccessRequest.initialize();

        // Init download manager id to be valid
		SimpleDataAccessRequest.downloadLocation.DownloadManagerId = "DM_1";
		expect(SimpleDataAccessRequest.requestStage).toBe('validation');
    });

    it("should be able to set products", function(done){
    	// Create a dummy feature
		var feature = {
			properties: {
				"links" : [{
	                "@href" : "dummy",
	                "@rel" : "self",
	                "@title" : "Reference link",
	                "@type" : "application/atom+xml"
	            }]
			}
		};

		// Set product
		SimpleDataAccessRequest.setProducts([feature]);
		expect(SimpleDataAccessRequest.productURLs.length).toEqual(1);

		done();
    });

    it("should be able to validate request", function(done) {
    	var triggerSpy = spyOn(SimpleDataAccessRequest, 'trigger').and.callThrough();
    	spyOn(SimpleDataAccessRequest, 'isValid').and.callThrough();
    	SimpleDataAccessRequest.submit().done(function() {
    		expect(SimpleDataAccessRequest.step).toEqual(1);
    		expect(SimpleDataAccessRequest.requestStage).toBe(statusesConfig.confirmationRequestStage);
    		expect(SimpleDataAccessRequest.isValid).toHaveBeenCalled();
    		expect(triggerSpy).toHaveBeenCalledWith('SuccessValidationRequest', jasmine.anything(), jasmine.anything());
    		expect(SimpleDataAccessRequest.totalSize).toBe(5000);
    		done();
    	});
    });

    it("should be able to confirm request", function(done) {
    	var triggerSpy = spyOn(SimpleDataAccessRequest, 'trigger')
    	SimpleDataAccessRequest.submit().done(function() {
			expect(triggerSpy).toHaveBeenCalledWith('SuccessConfirmationRequest', jasmine.anything(), jasmine.anything());
			done();
		});
    });

    it("should be able to initialize subscription", function(){
    	StandingOrderDataAccessRequest.initialize();
    	// Init download manager id & OpenSearchURL to be valid
		StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId = "DM_1";
		StandingOrderDataAccessRequest.OpenSearchURL = "http://localhost:3000/server/catalogueSearch/ND_OPT_1?start=2012-12-07T09:34:00&stop=2012-12-07T09:34:00&count=10&bbox=-15.5775,47.07669921875,12.5475,57.84330078125";
    });

    it("should be able to validate subscription", function(done) {
    	var triggerSpy = spyOn(StandingOrderDataAccessRequest, 'trigger').and.callThrough();
    	spyOn(StandingOrderDataAccessRequest, 'isValid').and.callThrough();
    	StandingOrderDataAccessRequest.submit().done(function() {
    		expect(StandingOrderDataAccessRequest.OpenSearchURL).not.toBe(null);
    		expect(StandingOrderDataAccessRequest.getSchedulingOptions().DataDriven).not.toBe(undefined);
    		// TODO: check better and add some more test for standing-order-specific params

    		done();
    	});
    });

});