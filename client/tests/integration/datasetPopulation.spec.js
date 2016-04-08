var Configuration = require('configuration');
var DataSetPopulation; 

describe("DatasetPopulation test", function() {

    beforeEach(function(done){
    	Configuration.url = "/client-dev/conf/"; // Use stub_server's url
    	// Load configuration
    	Configuration.load().done(function(){
    		done();
    	})

        DataSetPopulation = require('search/model/dataSetPopulation');
    });

    it("should be able to initialize & fetch", function(done) {
        expect(DataSetPopulation.initialize).toBeDefined();
        expect(DataSetPopulation.get("criterias")).toBe(null);
        expect(DataSetPopulation.get("matrix")).toBe(null);
        DataSetPopulation.initialize();
        DataSetPopulation.fetch().done(function(){
        	expect(DataSetPopulation.get('criterias').length).toBe(4);
        	done();
        });
		
    });

    it("should parse correctly the response from server", function(){
       	expect(_.findWhere(DataSetPopulation.get("criterias"), { title: "name" })).toBe(undefined); // name must be removed from criterias
    });

    it("should filter correctly datasets", function(){
    	expect(DataSetPopulation.filterDatasets(['S3']).length).toBe(3); // One dataset
    	expect(DataSetPopulation.filterDatasets(['S1', 'SAR']).length).toBe(2); // Multiple datasets
		expect(DataSetPopulation.filterDatasets(['', '', 'land mapping']).length).toBe(6); // Keyword
    });

    it("should be able to fetch dataset", function() {
    	var ajaxSpy = spyOn($, 'ajax').and.callThrough();
    	expect(ajaxSpy.calls.count()).toBe(0);
    	DataSetPopulation.fetchDataset('SENTINEL2_L1', function( dataset ){
    		expect(dataset.get("datasetId")).toBe("SENTINEL2_L1");
    		expect(ajaxSpy.calls.count()).toBe(1); // Ajax call has been made to retrieve dataset
    		// Check if it caches the dataset on another fetch
			DataSetPopulation.fetchDataset('SENTINEL2_L1', function( cachedDataset ) {
				expect(ajaxSpy.calls.count()).toBe(1); // No ajax, dataset has came from cache
			})

    	});
    });

    it("should react on selection of dataset", function() {
    	var datasetId = "ND_OPT_1";

		var ajaxSpy = spyOn($, 'ajax');
		DataSetPopulation.select(datasetId);
		
		// Pending ...

		ajaxSpy.calls.mostRecent().args[0].success(__fixtures__['stub_server/datasetSearchInfo/'+datasetId+'_datasetInfo'])
		expect(DataSetPopulation.selection.hasOwnProperty(datasetId)).toBe(true);
    });

    it("should react on unselection of dataset", function() {
    	var datasetId = "ND_OPT_1";
    	DataSetPopulation.unselect(datasetId);
    	expect(DataSetPopulation.selection.hasOwnProperty(datasetId)).toBe(false);
    });

});