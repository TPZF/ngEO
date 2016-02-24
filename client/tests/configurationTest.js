var Configuration = require('configuration');

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

        // Check override
        expect(Configuration.data["map"]["layers"].length).toBeGreaterThan(0); 
        expect(Configuration.data["map"]["browseDisplay"]["crossOrigin"]).toBe("anonymous");
    });

    it("checks get method", function() {
        expect(Configuration.get("map.openlayers.transitionEffect")).toBe("resize");
    });

    it("checks get/set mapped property methods", function() {
    	var feature = datasetResponse.features[0]; // Take the first one
    	expect(Configuration.getMappedProperty(feature, "start")).toBe("2015-06-20T12:36:48Z");
    });

    //will insert additional tests here later
});