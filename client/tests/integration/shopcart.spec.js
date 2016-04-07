var Configuration = require('configuration');
var ShopcartCollection;

describe("Shopcart test", function() {

    beforeEach(function(done){
    	Configuration.url = "/client-dev/conf/"; // Use stub_server's url
    	// Load configuration
    	Configuration.load().done(function(){
    		ShopcartCollection = require('shopcart/model/shopcartCollection');
    		done();
    	})
    });

    it("should be able to initialize", function() {
        expect(ShopcartCollection.initialize).toBeDefined();
        ShopcartCollection.initialize();

    });

    it("should be able to fetch", function(done){
    	ShopcartCollection.fetch().done(function() {
    		var shopcarts = ShopcartCollection.models;
			expect(shopcarts.length).toEqual(100);
			
			// Check shopcart's model
			expect(shopcarts[0].get("isDefault")).toBe(true);
			expect(shopcarts[0].get("id")).toBe("TPZ_SHP_01");
			expect(shopcarts[0].get("name")).toBe("S1 product's shopcart");
			expect(shopcarts[0].get("userId")).toBe("TPZ_user_01");
    	});
    });
});