define(['jquery','search/model/dataset'], function ($, Dataset) {

// Define the QUnit module and lifecycle.
QUnit.module("DatasetSearchInfo");

//load the datasets 
QUnit.asyncTest("Check Received dataset Search Info : DownloadOptions & Advanced Search Criteria", 9, function () {
	
	var dataset = new Dataset({datasetId : "SENTINEL2_L1"});
	
	dataset.fetch().done( function() {
			
			QUnit.equal(dataset.attributes.datasetId, "SENTINEL2_L1" , "Retrieved Dataset Id");
			QUnit.equal(dataset.attributes.description, "All L1 products for the S2 mission", "Retrieved dataset description");
			QUnit.ok($.isArray(dataset.attributes.keywords), "Retrieved dataset keywords");
			QUnit.ok($.isArray(dataset.attributes.downloadOptions), "Retrieved dataset downloadOptions");
			QUnit.ok(dataset.attributes.downloadOptions.length==2, "downloadOptions length 2");
			var downloadOptions = dataset.attributes.downloadOptions;
			QUnit.ok(downloadOptions[0].argumentName, "index 0 downloadOption argumentName found");
			QUnit.ok(downloadOptions[0].description, "index 0 downloadOption description found");
			QUnit.ok($.isArray(downloadOptions[0].value), "index 0 downloadOption values found");
			QUnit.ok($.isArray(dataset.attributes.attributes), "Retrieved dataset advanced criteria");
			
			QUnit.start();
	});
});

});