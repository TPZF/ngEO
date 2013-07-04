define(['jquery', 'configuration', 'account/model/shopcartList'], 
        function ($, Configuration, ShopcartList) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("ShopcartList", {
	    	setup: function() {
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done( function() {
	    			ShopcartList.initialize();

	    		});
	    	}
	    });
    
	    QUnit.asyncTest("Check Received Shopcart List ", 6, function () {

	    	ShopcartList.fetch().done( function() {
	    				
				var shopcarts = ShopcartList.attributes.shopcarts;
				QUnit.ok($.isArray(shopcarts), "Shopcarts list retrieved");
				
				//check the criteria 
				QUnit.ok(shopcarts[0].isDefault ,"Found default shopcart");
				QUnit.ok(shopcarts[0].id ,"The default shopcart has an id attribute");
				QUnit.ok(shopcarts[0].name ,"The default shopcart has a name attribute");
				QUnit.ok(shopcarts[0].userId ,"The default shopcart has a user id attribute");
				QUnit.ok(shopcarts.length==5 ,"There are 5 elts in the shopcart");
				QUnit.start();

	    	});
	    });
});