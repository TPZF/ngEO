define(['configuration'], function (Configuration) {

    // Define the QUnit module and lifecycle.
    QUnit.module("Configuration");

    QUnit.asyncTest("Check map configuration", 3, function () {
		Configuration.url = "../conf/configuration.json";
		Configuration.load()
			.done( function() {
				var mapData = Configuration.data.map;
				QUnit.ok(mapData,"map object found in configuration");
				QUnit.ok($.isArray(mapData.layers),"layers found in map configuration");
				QUnit.ok($.isArray(mapData.backgroundLayers),"background layers found in map configuration");
				QUnit.start();
			});
	});

});