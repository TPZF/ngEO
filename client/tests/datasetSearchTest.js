define(['jquery','search/model/datasetSearch'], function ($, DatasetSearch) {

// Define the QUnit module and lifecycle.
QUnit.module("DatasetSearch");

// Check fromISOString
QUnit.test("Check fromISOString", function () {
	var s1 = "2002-11-30";
	var d1 = Date.fromISOString(s1);
	QUnit.equal( d1.toISOString(), s1+"T00:00:00.000Z", "date equal without time" );
	var s2 = "2012-01-31T18:54:00.000Z";
	var d2 = Date.fromISOString(s2);
	QUnit.equal( d2.toISOString(), s2, "date equal with time" );
	var s3 = "2012-01-31T18:54Z";
	var d3 = Date.fromISOString(s3);
	QUnit.equal( d3.toISOString(), s2, "date equal with time, without second" );
	var s4 = "2012-01-31T18:54:11Z";
	var d4 = Date.fromISOString(s4);
	QUnit.equal( d4.toISOString(), "2012-01-31T18:54:11.000Z", "date equal with time, without millisecond" );
});

// Check from URL with bbox
QUnit.test("Check dataset search from URL with bbox", function () {

	var url = "http://localhost:3000/ngeo/catalogueSearch/ND_S2_1?start=2012-12-27T00:00:00.000Z&stop=2019-07-31T00:00:00.000Z&bbox=-147.65625,-78.75,147.65625,78.75"
	
	DatasetSearch.populateModelfromURL(url);
	QUnit.equal( DatasetSearch.get("start").toISOString(), "2012-12-27T00:00:00.000Z", "start date equal" );
	QUnit.equal( DatasetSearch.get("stop").toISOString(), "2019-07-31T00:00:00.000Z", "stop date equal" );
	QUnit.equal( DatasetSearch.get("datasetId"), "ND_S2_1", "datasetId equal" );
	
	var bbox = DatasetSearch.searchArea.getBBox();
	QUnit.ok( DatasetSearch.searchArea.getMode() == 0, "is bbox"  );
	QUnit.equal( bbox.west, -147.65625, "bbox west equal" );
	QUnit.equal( bbox.south, -78.75, "bbox south equal" );
	QUnit.equal( bbox.east, 147.65625, "bbox east equal" );
	QUnit.equal( bbox.north, 78.75, "bbox north equal" );
});

// Check from URL with polygon
QUnit.test("Check dataset search from URL with polygon", function () {

	var url = "http://localhost:3000/ngeo/catalogueSearch/ND_S2_1?start=2012-12-27T00:00:00.000Z&stop=2019-07-31T00:00:00.000Z&geom=POLYGON((37.6171875 -18.6328125,9.84375 -16.69921875,18.10546875 19.3359375,33.75 18.6328125,46.93359375 -6.50390625,46.93359375 -6.50390625,37.6171875 -18.6328125))";
	
	DatasetSearch.populateModelfromURL(url);
	QUnit.equal( DatasetSearch.get("start").toISOString(), "2012-12-27T00:00:00.000Z", "start date equal" );
	QUnit.equal( DatasetSearch.get("stop").toISOString(), "2019-07-31T00:00:00.000Z", "stop date equal" );
	QUnit.equal( DatasetSearch.get("datasetId"), "ND_S2_1", "datasetId equal" );
	
	QUnit.ok( DatasetSearch.searchArea.getMode() == 1, "is polygon"  );
	var coordinates = DatasetSearch.searchArea.getFeature().geometry.coordinates[0];
	QUnit.equal( coordinates[0][0], 37.6171875, "first coord equal" );
	QUnit.equal( coordinates[0][1], -18.6328125, "second coord equal" );
});


});