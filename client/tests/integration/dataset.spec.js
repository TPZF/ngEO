var Configuration = require('configuration');
var DataSet = require('search/model/dataset');

// Helper function to convert a string in ISO format to date
// MS: actually initialized in SearchCriteria: move it somewhere and add dependency to Dataset
Date.fromISOString = function(str) {

	var reDate = /(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+)(?::(\d+)(?:.(\d+))?)?Z)?/;
	var match = reDate.exec(str);
	if (match) {
		// Hack to support bad date
		if (match[1].length < match[3].length) {
			var tmp = match[1];
			match[1] = match[3];
			match[3] = tmp;
		}

		// Need to cut the original precision to only first 3 digits since UTC constructor accepts milliseconds only in range between 0-999
		// @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
		if (match[7] && match.length > 3) {
			match[7] = match[7].substr(0, 3);
		}

		var date = new Date(Date.UTC(match[1], match[2] - 1, match[3], match[4] || 0, match[5] || 0, match[6] || 0, match[7] || 0));

		return date;
	} else {
		throw "Invalid ISO date";
	}
};

// Private variables
var dataset;

describe("Dataset test", function() {

	beforeEach(function(done) {

		// Load configuration
		Configuration.load().done(function() {
			done();
		})
	});

	it("should be able to initialize", function(done) {

		dataset = new DataSet({
			datasetId: "SENTINEL2_L1"
		});
		expect(dataset.url).toBe("/ngeo/datasetSearchInfo/SENTINEL2_L1");

		dataset.fetch().done(function(){
			done();
		});
	});

	it("should contain the attributes coming from datasetSearchInfo request", function() {
		expect(dataset.get("datasetId")).toBe("SENTINEL2_L1");
		expect(dataset.get("description")).toBe("All L1 products for the S2 mission", "Retrieved dataset description");
		expect($.isArray(dataset.get("keywords"))).toBe(true); // retrieved dataset keywords

		var downloadOptions = dataset.get("downloadOptions");
		expect($.isArray(downloadOptions)).toBe(true); // download options is an array
		expect(downloadOptions.length).toBe(2);
		expect(downloadOptions[0].argumentName).toBe("ProductFormat"); // index 0 downloadOption argumentName found
		expect(downloadOptions[0].description).toBe("desired download format");
		expect($.isArray(downloadOptions[0].value)).toBe(true);

		expect($.isArray(dataset.get("attributes"))).toBe(true);

	});

});