var Configuration = require('configuration');

describe("Configuration test", function() {
    
	// Mocks of configurations, not really need for the moment..
    var serverConfigurationMock = __html__["stub_server/webClientConfigurationData/configuration.json"];
    var clientConfigurationMock = __html__["client/conf/configuration.json"];
	
	it("should load configurations", function(done) {
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		Configuration.load().done(function(response){
			expect(Configuration.data).not.toEqual({});
			done();
		})
	});

    it("should override basic configuration by server configuration on load", function() {

        Configuration.setConfigurationData(clientConfigurationMock);
        Configuration.buildServerConfiguration(serverConfigurationMock);

        // Check override
        expect(Configuration.data["map"]["layers"].length).toBeGreaterThan(0); 
        expect(Configuration.data["map"]["browseDisplay"]["crossOrigin"]).toBe("anonymous");
    });

    it("checks get method", function() {
        Configuration.buildServerConfiguration(serverConfigurationMock);
        expect(Configuration.get("map.openlayers.transitionEffect")).toBe("resize");
    });

    it("checks get/set mapped property methods", function() {
        // TODO: mock feature and check the access to mapped properties + load localConfiguration

    });

    //will insert additional tests here later
});