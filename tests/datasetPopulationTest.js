define(['jquery','search/model/dataSetPopulation'], function ($, DataSetPopulation) {

// Define the QUnit module and lifecycle.
QUnit.module("DataSetPopulation");

//load the datasets 
QUnit.asyncTest("Check Received datasets", 9, function () {
	var model = new DataSetPopulation();
	model.fetch().done( function() {
			var matrix = model.get('matrix');
			QUnit.ok($.isArray(matrix),"Matrix retrieved");
			QUnit.ok(matrix.length == 20 , "Datasets length 20");
			
			//check the criteria 
			QUnit.ok(model.get('criterias').length == 3,"three criteria found");
			QUnit.equal(model.get('criterias')[0].title, "mission" , "mission criterion found");
			QUnit.equal(model.get('criterias')[1].title, "sensor" , "sensor criterion found");
			QUnit.equal(model.get('criterias')[2].title, "keyword" , "keyword criterion found");
			
			//filter the datasets 
			var datasets;
			datasets = model.filterDatasets([ 'S1', 'SAR' ]);
			QUnit.ok(datasets.length==2 , "Filtred 2 : mission:S1 sensor:SAR datasets");
			
			datasets = model.filterDatasets([ 'S3' ]);
			QUnit.ok(datasets.length==3 , "Filtred 3 : mission:S3 datasets");
			
			datasets = model.filterDatasets([ '', '', 'land mapping' ]);
			QUnit.ok(datasets.length == 6 , "Filtred 6 : keyword:land mapping datasets");
			
			QUnit.start();
		});
});



});