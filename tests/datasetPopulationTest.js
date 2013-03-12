define(['jquery','search/model/dataSetPopulation'], function ($, DataSetPopulation) {

// Define the QUnit module and lifecycle.
QUnit.module("DataSetPopulation");

//load the datasets 
QUnit.asyncTest("Check Received datasets", 9, function () {
	var model = new DataSetPopulation();
	model.fetch().done( function() {
			var datasets = model.attributes.datasets;
			QUnit.ok($.isArray(datasets),"Datasets retrieved");
			QUnit.ok(datasets.length == 10 ,"Datasets length 10");
			
			//check the criteria 
			QUnit.ok(model.attributes.criteria.length == 3,"three criteria found");
			QUnit.equal(model.attributes.criteria[0].criterionName, "mission" , "mission criterion found");
			QUnit.equal(model.attributes.criteria[1].criterionName, "sensor" , "sensor criterion found");
			QUnit.equal(model.attributes.criteria[2].criterionName, "keyword" , "keyword criterion found");
			
			//filter the datasets 
			model.filter('\\b(S1,SAR,([^"]*|""),[^"]*,[^"]*)');
			QUnit.ok(model.attributes.datasetsToDisplay.length==2 , "Filtred 2 : mission:S1 sensor:SAR datasets");
			
			model.filter('\\b(S3,([^"]*|""),([^"]*|""),[^"]*,[^"]*)');
			QUnit.ok(model.attributes.datasetsToDisplay.length==3 , "Filtred 3 : mission:S3 datasets");
			
			model.filter('\\b(([^"]*|""),([^"]*|""),land mapping,[^"]*,[^"]*)');
			QUnit.ok(model.attributes.datasetsToDisplay.length==5 , "Filtred 5 : keyword:land mapping datasets");
			
			QUnit.start();
		});
});



});