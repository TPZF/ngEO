var Configuration = require('configuration');
var Map; 

describe("Map test", function() {

    beforeEach(function(done){

    	// Load configuration
    	Configuration.load().done(function(){
    		done();
    	})

        Map = require('map/map');
    });

    it("should be able to initialize", function() {
        expect(Map.initialize).toBeDefined();
        var $el = $('<div id="map"></div>').appendTo("body");
        Map.initialize("map");
		
		// Test of request to stub_server
        $.ajax({
        	type: "GET",
        	url: "/ngeo/catalogue/S2MSI1A/search?start=2015-06-20T00:00:00.000Z&stop=2015-06-27T23:59:59.999Z&bbox=-163.04,-80.95,163.03,80.94&format=json&count=100&startIndex=1",
        	//
        	success: function(data) {
        		console.log("DATA", data);
        	},
        	error: function(xhr, thrownError, c) {
        		console.log("ERROR", thrownError);
        	}
        })
    });

});