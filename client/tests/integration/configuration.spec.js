var Configuration = require('configuration');

// TODO: doesn't work actually...
xdescribe("Failure loading", function() {

	beforeEach(function(){
		jasmine.Ajax.install();
	});

	it("should not affect configuration if load fails", function(done){
		
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		jasmine.Ajax.stubRequest(Configuration.url + "/webClientConfigurationData").andReturn({
			"status": 500,
			"contentType": "text/plain",
			"responseText": "Coucou"
		});
		jasmine.Ajax.stubRequest(Configuration.url + "/localConfiguration.json").andReturn({
			"status": 500,
			"contentType": "text/plain",
			"responseText": "Coucou"
		});
		jasmine.Ajax.stubRequest(Configuration.url + "/configuration.json").andReturn({
			"status": 500,
			"contentType": "text/plain",
			"responseText": "Coucou"
		});
		Configuration.load().done(function(response){
			console.log(response)
			expect(Configuration.data).toEqual({});
			done();
		}).fail(function(){
			console.log("Error");
			done();
		});
	});

	afterEach(function(){
		jasmine.Ajax.uninstall();
	})

});

describe("Configuration test", function() {
    
    var datasetResponse = __fixtures__["stub_server/productSearch/Virtual_response"];
	
	it("should load configurations", function(done) {
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		Configuration.load().done(function(response){
			expect(Configuration.data).not.toEqual({});
			done();
		})
	});

    it("should override basic configuration by server configuration on load", function() {

        // Check server configuration
        var mapData = Configuration.data["map"];
        expect(mapData).toBeDefined();
        expect(mapData["layers"].length).toBeGreaterThan(0); 
        expect($.isArray(mapData["backgroundLayers"])).toBe(true);

        // Check override (in configuration.json of client it is "use-credentials")
        expect(mapData["browseDisplay"]["crossOrigin"]).toBe("anonymous");
    });

    it("should check local configuration", function(){
    	// Check local configuration
		var dataAccessRequestStatuses = Configuration.localConfig.dataAccessRequestStatuses;
		expect(dataAccessRequestStatuses).toBeDefined();
		expect(dataAccessRequestStatuses.validStatuses).toBeDefined();
		expect(dataAccessRequestStatuses.validStatuses.inProgressStatus.value).toBe(0); // in progress status 0
		expect(dataAccessRequestStatuses.validStatuses.pausedStatus.value).toBe(1); // paused status 1
		expect(dataAccessRequestStatuses.validStatuses.completedStatus.value).toBe(2); // completed status 2
		expect(dataAccessRequestStatuses.validStatuses.cancelledStatus.value).toBe(3); // cancelled status 3
		expect(dataAccessRequestStatuses.validStatuses.validatedStatus.value).toBe(4); // validated status 4
		expect(dataAccessRequestStatuses.validStatuses.bulkOrderStatus.value).toBe(5); // bulk order status 5
    });

    it("checks get method", function() {
        expect(Configuration.get("map.openlayers.transitionEffect")).toBe("resize");
    });

    it("checks get/set mapped property methods", function() {
    	var feature = datasetResponse.features[0]; // Take the first one
    	expect(Configuration.getMappedProperty(feature, "start")).toBe("2015-06-20T12:36:48Z");
    	Configuration.setMappedProperty(feature, "start", "2020-06-20T12:36:48Z");
    	expect(Configuration.getMappedProperty(feature, "start")).toBe("2020-06-20T12:36:48Z");
    });

    //will insert additional tests here later
});