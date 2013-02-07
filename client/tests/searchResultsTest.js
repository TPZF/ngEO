define(['jquery', 'configuration', 'searchResults/model/searchResults'], 
        function ($, Configuration, SearchResults) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("SearchResults", {
	    	setup: function() {
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done( function() {
	    			SearchResults.countPerPage = Configuration.data.searchResults.countPerPage;
	    		});
	    	}
	    });
    
	    QUnit.test("Check selection ", function () {
		
			var features = [ "f1", "f2", "f3", "f4", "f5" ];
			
			SearchResults.select( features[0] );
	        QUnit.ok( SearchResults.selection.length == 1, "selection length ok after 1 select" );
	        QUnit.ok( SearchResults.selection[0] == features[0], "selection content ok after 1 select" );
			SearchResults.select( features[2] );
	        QUnit.ok( SearchResults.selection.length == 2, "selection length ok after 2 select" );
	        QUnit.ok( SearchResults.selection[1] == features[2], "selection content ok after 2 select" );
			SearchResults.unselect( features[0] );
	        QUnit.ok( SearchResults.selection.length == 1, "selection length ok after unselect" );
	        QUnit.ok( SearchResults.selection[0] == features[2], "selection content ok after unselect" );
	    });

    
});