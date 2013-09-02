define(['jquery', 'configuration', 'shopcart/model/shopcartCollection'], 
        function ($, Configuration, ShopcartCollection) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("ShopcartCollection", {
	    	setup: function() {
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done( function() {
	    			ShopcartCollection.initialize();

	    		});
	    	}
	    });
    
	    QUnit.asyncTest("Check Received Shopcart List ", 8, function () {

	    	ShopcartCollection.fetch().done( function() {
	    				
				var shopcarts = ShopcartCollection.models;
				QUnit.ok($.isArray(shopcarts), "Shopcarts list retrieved");
				
				//check the criteria 
				QUnit.ok(shopcarts[0].attributes.isDefault ,"Found default shopcart");
				QUnit.equal(ShopcartCollection.currentShopcartId, "TPZ_SHP_01" ,"default shopcart is the current shopcart");
				QUnit.ok(shopcarts[0].id ,"The default shopcart has an id attribute");
				QUnit.equal(shopcarts[0].id, "TPZ_SHP_01", "the first shopcart id is ok");
				QUnit.ok(shopcarts[0].attributes.name ,"The default shopcart has a name attribute");
				QUnit.ok(shopcarts[0].attributes.userId ,"The default shopcart has a user id attribute");
				QUnit.ok(shopcarts.length==5 ,"There are 5 elts in the shopcart");
			
				QUnit.start();
	    	});
	    });
});