define(['jquery', 'configuration', 'searchResults/model/featureCollection'], 
        function ($, Configuration, FeatureCollection) {

    QUnit.test("Check selection ", function () {
	
		var features = [ "f1", "f2", "f3", "f4", "f5" ];
		
		var fc = new FeatureCollection();

		fc.select( features[0] );
        QUnit.ok( fc.selection.length == 1, "selection length ok after 1 select" );
        QUnit.ok( fc.selection[0] == features[0], "selection content ok after 1 select" );
		fc.select( features[2] );
        QUnit.ok( fc.selection.length == 2, "selection length ok after 2 select" );
        QUnit.ok( fc.selection[1] == features[2], "selection content ok after 2 select" );
		fc.unselect( features[0] );
        QUnit.ok( fc.selection.length == 1, "selection length ok after unselect" );
        QUnit.ok( fc.selection[0] == features[2], "selection content ok after unselect" );
		
		fc.selection = [];
    });
});