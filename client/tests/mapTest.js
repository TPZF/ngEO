var serverConfigurationMock = __html__["stub_server/webClientConfigurationData/configuration.json"];
var clientLocalConfigurationMock = __html__["client/conf/localConfiguration.json"];

var Configuration = require('configuration');
var Map; 

describe("Map test", function() {

    beforeEach(function(){

        // Set configuration
        Configuration.localConfig = JSON.parse(clientLocalConfigurationMock);
        Configuration.buildServerConfiguration(serverConfigurationMock);

        Map = require('map/map');
        spyOn(Map, 'initialize').and.callThrough();
    });

    afterEach(function() {
        //
    });

    it("should be able to initialize", function() {
        expect(Map.initialize).toBeDefined();
        Map.initialize("<div>");
    });

});