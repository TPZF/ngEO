var Configuration = require('configuration');
var DataSetPopulation; 

describe("DatasetPopulation test", function() {

    beforeEach(function(done){

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

});