(function () {

    // Defer Qunit so RequireJS can work its magic and resolve all modules.
    QUnit.config.autostart = false;

    // Configure RequireJS so it resolves relative module paths from the `src`
	// folder.
    require.config({
        baseUrl: "../js",
    });

	// A list of all QUnit test Modules.  Make sure you include the `.js` 
	// extension so RequireJS resolves them as relative paths rather than using
	// the `baseUrl` value supplied above.
	var testModules = [
		"configurationTest.js",
		"menuBarTest.js",
		"datasetPopulationTest.js",
		"simpleDataAccessRequestTest.js",
		"downloadManagersTest.js",
		"standingOrderDataAccessRequestTest.js",
		"searchResultsTest.js",
		"dataAccessRequestStatusesTest.js"
	];
	
    // Resolve all testModules and then start the Test Runner.
	require(testModules, QUnit.start);
}());

