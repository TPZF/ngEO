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
		console.log(bbox.west);
		expect( bbox.west ).toEqual(-147.65625);
		expect( bbox.south ).toEqual(-78.75);
		expect( bbox.east ).toEqual(147.65625);
		expect( bbox.north ).toEqual(78.75);

		// Polygon
		DatasetSearch.populateModelfromURL("geom=POLYGON((37.6171875 -18.6328125,9.84375 -16.69921875,18.10546875 19.3359375,33.75 18.6328125,46.93359375 -6.50390625,46.93359375 -6.50390625,37.6171875 -18.6328125))")
		var coordinates = DatasetSearch.searchArea.getFeature().geometry.coordinates[0];
		expect( coordinates[0][0]).toEqual(37.6171875);
		expect( coordinates[0][1]).toEqual(-18.6328125);
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

});