var Configuration = require('configuration');
var DataSet = require('search/model/dataset');
var DownloadOptions = require('search/model/downloadOptions');

var FeatureCollection;

/**
 *	Response with helper
 *	Try to use our stub_server insted but it implies code refactoring to return promises..
 *
 *	Insipred from here: http://www.michaelfalanga.com/2014/04/03/mock-jquery-ajax-calls-with-jasmine/
 */
var respondWith = function(response) {
	var ajaxSpy = spyOn($, 'ajax');
	var d = $.Deferred();
	d.resolve(response);
	ajaxSpy.and.returnValue(d.promise());
	return new FeatureCollection();
}

describe("FeatureCollection test", function() {

	var fc;
	beforeEach(function(done) {
		Configuration.url = "/client-dev/conf/"; // Use stub_server's url
		// Load configuration
		Configuration.load().done(function() {
			FeatureCollection = require('searchResults/model/featureCollection');
			done();
		});
	});

	it("should be able to initialize", function() {
		fc = new FeatureCollection();
	});

	it("should be able to make a search", function() {
		var baseUrl = "/ngeo/catalogue/S2MSI1A/search?start=2015-06-20T00:00:00.000Z&stop=2015-06-27T23:59:59.999Z&bbox=-163.04,-80.95,163.03,80.94&format=json";

		jasmine.Ajax.install();

		fc = respondWith( __fixtures__["stub_server/productSearch/S2MSI1A_page1_response"] );
		// Update fc countPerPage to be 5 to test pagination
		fc.countPerPage = 5;
		
		fc.search(baseUrl);
		expect(fc.features.length).toEqual(fc.countPerPage);
		expect(fc.totalResults).toEqual(100); // TODO: check if it's normal that total results is a string
		expect(fc.currentPage).toEqual(1);
		expect(fc.lastPage).toEqual(Math.ceil(fc.totalResults / fc.countPerPage));
		expect(fc.features[0].id).toBe("https://ngeopro.magellium.fr/ngeo/catalogue/S2MSI1A/search?start=2015-06-20T20:46:12.000Z&stop=2015-06-20T20:46:12.000Z&format=atom");
		expect($.ajax).toHaveBeenCalled();

		jasmine.Ajax.uninstall();
	});

	it("should be able to change pages and use cache to retrieve previously loaded results from cache", function() {
		var d = $.Deferred();
		var ajaxSpy = spyOn($, 'ajax').and.returnValue(d.promise());
		d.resolve(__fixtures__["stub_server/productSearch/S2MSI1A_page2_response"]);
		
		fc.changePage(2);
		expect(fc.currentPage).toEqual(2);
		expect(fc.features[0].id).toBe("https://ngeopro.magellium.fr/ngeo/catalogue/S2MSI1A/search?start=2015-06-20T17:27:58.000Z&stop=2015-06-20T17:27:58.000Z&format=atom");

		// Expect ajax to be called once
		expect($.ajax).toHaveBeenCalled();
		expect(ajaxSpy.calls.count()).toBe(1);

		// Return to first page
		fc.changePage(1);
		// The results are already in cache --> no ajax
		expect(ajaxSpy.calls.count()).toBe(1); // Still one call
		expect(fc.features[0].id).toBe("https://ngeopro.magellium.fr/ngeo/catalogue/S2MSI1A/search?start=2015-06-20T20:46:12.000Z&stop=2015-06-20T20:46:12.000Z&format=atom");
	});

	describe("Interaction with download options & dataset test", function() {

		var s1dataset;
		var s1downloadOptions;
		var datasetId = "S1_SAR_EW_DUAL_POL";
		it("initializes dataset and download options to be used for next step", function(done) {
			// TODO: Do not initialize Dataset but create DownloadOptions object from mock
			s1dataset = new DataSet({
				datasetId: datasetId
			});
			s1dataset.fetch().done(function(resp){
				s1downloadOptions = new DownloadOptions(s1dataset.get("downloadOptions"), {init: true});
				done();
			});
		});

		it("should be able to update product url", function() {
			// MS: It really shouldn't ! Code need to be refactored..

			fc = respondWith( __fixtures__["stub_server/productSearch/S1_SAR_EW_DUAL_POL_response"] );
			fc.search("/ngeo/catalogue/"+ datasetId +"/search?start=2015-06-20T00:00:00.000Z&stop=2015-06-27T23:59:59.999Z&bbox=-163.04,-80.95,163.03,80.94&format=json");

			s1downloadOptions.setValue("ProductFormat", "JP2");
			// TODO: the product url comes with do_crop as true, think about evolution
			expect(Configuration.getMappedProperty(fc.features[0], "productUrl")).toBe("https://ngeopro.magellium.fr/ngeo/catalogue/S1_SAR_EW_DUAL_POL/search?id=S1A_EW_RAW__0SDH_20150714T223605_20150714T223710_006813_0092BE&format=atom&ngEO_DO={processing:RAW,do_crop:true}");
			fc.select([fc.features[0]]);
			fc.updateDownloadOptions(s1downloadOptions);
			// Check that it updates do_crop to WKT & ProductFormat to JP2
			expect(Configuration.getMappedProperty(fc.features[0], "productUrl")).toBe("https://ngeopro.magellium.fr/ngeo/catalogue/S1_SAR_EW_DUAL_POL/search?id=S1A_EW_RAW__0SDH_20150714T223605_20150714T223710_006813_0092BE&format=atom&ngEO_DO={processing:SLC,Otherwise option:[val1,val2],do_crop:POLYGON((37.6171875 -18.6328125,9.84375 -16.69921875,18.10546875 19.3359375,33.75 18.6328125,46.93359375 -6.50390625,46.93359375 -6.50390625,37.6171875 -18.6328125)),ProductFormat:JP2}");

			// Check through getSelectedDownloadOptions method
			var extractedDownloadOptions = fc.getSelectedDownloadOptions();
			expect(extractedDownloadOptions.ProductFormat).toBe("JP2");
			expect(extractedDownloadOptions.do_crop).toContain("POLYGON");
		});

		it("should return datasetId from the given feature", function() {
			var datasetId = fc.getDatasetId(fc.features[0]);
			expect(datasetId).toBe(datasetId);

			// Force dataset to be undefined so FeatureCollection could guess the datasetId from feature
			fc.dataset = null;
			expect(fc.getDatasetId(fc.features[0])).toBe(datasetId);
		});

		it("should return datasetIds for current selection", function() {
			var selectionIds = fc.getSelectionDatasetIds();
			expect(selectionIds[0]).toBe(datasetId);
			expect(selectionIds.length).toEqual(1);
			// TODO: add dummy feature which belongs to other dataset (shopcart example) test

		});

		it("should be able to fetch the current download options", function(done) {
			// Ensure that the dataset isn't defined
			expect(fc.dataset).toBe(null);
			var ajaxSpy = spyOn($, 'ajax').and.callThrough();
			expect(ajaxSpy.calls.count()).toBe(0);
			fc.fetchAvailableDownloadOptions(function(downloadOptions){
				expect(ajaxSpy.calls.count()).toBe(1); // ajax call has been made
				expect(downloadOptions.length).toEqual(5);
				done();
			});
		});

		it("should be able to select/unselect all features", function() {
			expect(fc.selection.length).toEqual(1);
			fc.selectAll();
			expect(fc.selection.length).toEqual(fc.features.length);
			fc.unselectAll();
			expect(fc.selection.length).toEqual(0);
		});

	});

});