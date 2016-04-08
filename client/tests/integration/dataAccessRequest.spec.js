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
    		statusesConfig = Configuration.localConfig.dataAccessRequestStatuses;
    		done();
    	})
    });


    it("should be able to initialize", function() {
        expect(SimpleDataAccessRequest.initialize).toBeDefined();
        SimpleDataAccessRequest.initialize();
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
		expect(SimpleDataAccessRequest.requestStage).toBe('validation');

		// Init download manager id to be valid
		SimpleDataAccessRequest.downloadLocation.DownloadManagerId = "DM_1";

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

});