var Configuration = require('configuration');
var DatasetSearch;

describe("DatasetSearch test", function(done) {

    beforeEach(function(done){
    	Configuration.url = "/client-dev/conf/"; // Use stub_server's url
    	// Load configuration
    	Configuration.load().done(function(){

    		DatasetSearch = require('search/model/datasetSearch');
    		done();
    	})

    });

    it("should be able to populate its model from url", function() {
        var url = "start=2012-12-27T00:00:00.000Z&stop=2019-07-31T00:00:00.000Z&bbox=-147.65625,-78.75,147.65625,78.75"
		DatasetSearch.populateModelfromURL(url);

		// Date
		expect( DatasetSearch.get("start").toISOString() ).toBe("2012-12-27T00:00:00.000Z");
		expect( DatasetSearch.get("stop").toISOString() ).toBe("2019-07-31T00:00:00.000Z");

		// Bbox
		var bbox = DatasetSearch.searchArea.getBBox();
		expect( DatasetSearch.searchArea.getMode() ).toEqual(0);
		expect( bbox.west ).toEqual(-147.65625);
		expect( bbox.south ).toEqual(-78.75);
		expect( bbox.east ).toEqual(147.65625);
		expect( bbox.north ).toEqual(78.75);

		// Polygon
		DatasetSearch.populateModelfromURL("geom=POLYGON((37.6171875 -18.6328125,9.84375 -16.69921875,18.10546875 19.3359375,33.75 18.6328125,46.93359375 -6.50390625,46.93359375 -6.50390625,37.6171875 -18.6328125))")
		var coordinates = DatasetSearch.searchArea.getFeature().geometry.coordinates[0];
		expect( coordinates[0][0]).toEqual(37.6171875);
		expect( coordinates[0][1]).toEqual(-18.6328125);

		// TODO: check download options/advanced options
    });
	
	// TODO: move it to another module !
	it("should convert from ISO string to date", function() {

		var s1 = "2002-11-30";
		var d1 = Date.fromISOString(s1);
		expect( d1.toISOString() ).toBe("2002-11-30T00:00:00.000Z");
		var s2 = "2012-01-31T18:54:00.000Z";
		var d2 = Date.fromISOString(s2);
		expect( d2.toISOString() ).toBeDefined("2012-01-31T18:54:00.000Z");
		var s3 = "2012-01-31T18:54Z";
		var d3 = Date.fromISOString(s3);
		expect( d3.toISOString() ).toBe("2012-01-31T18:54:00.000Z");
		var s4 = "2012-01-31T18:54:11Z";
		var d4 = Date.fromISOString(s4);
		expect( d4.toISOString() ).toBe("2012-01-31T18:54:11.000Z");
	});

	describe("Interaction with dataset workflow", function() {
		var dataset;
		var datasetId = "ND_OPT_1";
		it("should initialize dataset", function(){
			// Initialize dummy dataset using fixture (just to test the different init, could be async-fetch as well)
			dataset = new DataSet({datasetId: datasetId});
			dataset.set(dataset.parse(__fixtures__["stub_server/datasetSearchInfo/ND_OPT_1_datasetInfo"]));
		});

		it("should be able to react on dataset selection", function(){
			DatasetSearch.onDatasetSelectionChanged(dataset);
			expect(DatasetSearch.get("downloadOptions")[datasetId]).toBeDefined();
			expect(DatasetSearch.get("advancedAttributes")[datasetId]).toBeDefined();
		});

		// TODO: refactor code, to use DownloadOptions object prototype to retrieve current download options
		it('should be able to retrieve the currently selected download options', function(){
			// Check selected download options
			var downloadOptions = DatasetSearch.getSelectedDownloadOptions(dataset);
			expect(downloadOptions["productFormat"]).toEqual("GeoTIFF");
			expect(downloadOptions["cropProduct"]).toEqual(true);
		});

		it("should add advanced criteria of the given dataset to the given url", function() {

			// <!> advancedAttributes on dataset are not the same as on DatasetSearch ;) (@see _.clone) </!>
			//console.log("dataset-advanced", _.findWhere(dataset.get("attributes"), {"id": "pass"}));
			//console.log("datasetSearch-advanced", _.findWhere(DatasetSearch.get("advancedAttributes")[datasetId], {"id": "pass"}));

			// Update advanced attributes on DatasetSearch
			var datasetSearchAdvanced = DatasetSearch.get("advancedAttributes")[datasetId];
			_.findWhere(datasetSearchAdvanced, { "id": "uuid" }).value = "Yesterday, all my troubles seemed so far away"; // String
			_.findWhere(datasetSearchAdvanced, { "id": "pass" }).value = "Ascending"; // List
			_.findWhere(datasetSearchAdvanced, { "id": "orbit" }).value = "[1,300]"; // Number
			var url = DatasetSearch.addAdvancedCriteria("start=2002-11-30T00:00:00.000Z", datasetId);
			expect(url.indexOf("uuid=Yesterday, all my troubles seemed so far away") > 0).toBe(true);
			expect(url.indexOf("pass=Ascending") > 0).toBe(true);
			expect(url.indexOf("orbit=[1,300]") > 0).toBe(true);

		});

		it("should add download options of the given dataset to the given url", function() {
			var url = DatasetSearch.addDownloadOptions("start=2002-11-30T00:00:00.000Z", datasetId);
			// Check the cropProduct exist and transformed in WKT
			expect(url.indexOf("cropProduct:POLYGON((37.6171875 -18.6328125,9.84375 -16.69921875,18.10546875 19.3359375,33.75 18.6328125,46.93359375 -6.50390625,46.93359375 -6.50390625,37.6171875 -18.6328125))") >= 0).toBe(true);
		});

	});


});