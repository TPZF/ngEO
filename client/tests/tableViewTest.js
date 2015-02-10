define(['jquery', 'configuration', 'ui/tableView', 'searchResults/model/featureCollection'], 
        function ($, Configuration, TableView, FeatureCollection) {

		var view = null;
		var fc = null;
		var columnDefs = [
					{"sTitle" : "Name", "mData" : "properties.name" },
					{"sTitle" : "Date", "mData" : "properties.date"}
				];
				
		var features = [{
						id: 0,
						type: "Feature",
						properties: {
							name: "toto",
							date: "2003/01/02"
						}
					}, {
						id: 1,
						type: "Feature",
						properties: {
							name: "titi",
							date: "2003/01/01"
						}
					}, {
						id: 2,
						type: "Feature",
						properties: {
							name: "tutu",
							date: "2003/04/01"
						}
					}
				];


	    // Define the QUnit module and lifecycle.
	    QUnit.module("TableView", {
	    	setup: function() {
	    			fc = new FeatureCollection();
					// Create a view
					view = new TableView({
						model: fc,
						columnDefs: columnDefs
					});
					view.render();
					view.$el.append("#qunit-fixture");
		    	},
			teardown: function() {
					fc.reset();
					view.remove();
					view = null;
				}
	    });
    
	    QUnit.test("Check add features",  function () {				
				
				fc.addFeatures(features);
			
				QUnit.ok( view.rowsData.length == 3, "3 Rows added" );
				QUnit.ok( view.rowsData[0].cellData[0] == "toto", "Row 1 : value ok" );
				QUnit.ok( view.rowsData[2].cellData[0] == "tutu", "Row 3 : value ok" );
				
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows build" );
		});
		
		
	    QUnit.test("Check filter features",  function () {
				
				fc.addFeatures(features);
				
				view.filterData('');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows after empty filter" );
				view.filterData('toto');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 1, "1 rows after filter" );
				view.filterData('');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows after empty filter" );
		});	
		
	    QUnit.test("Check sort features",  function () {	
		
				fc.addFeatures(features);
				
				view.sortData(1,'desc');
				QUnit.ok( view.visibleRowsData[0].cellData[0] == "tutu", "sort desc works" );
				view.sortData(1,'asc');
				QUnit.ok( view.visibleRowsData[0].cellData[0] == "titi", "sort asc works" );
				view.sortData(1,'original');
				QUnit.ok( view.visibleRowsData[0].cellData[0] == "toto", "sort original works" );
		    });
    
	    QUnit.test("Check remove feature",  function () {

				fc.addFeatures(features);
				
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows at beginning" );

				view.removeData( [ features[0], features[2] ] );
				
				QUnit.ok( view.rowsData.length == 1, "1 row data after removal" );
				QUnit.ok( view.rowsData[0].feature == features[1], "Data ok after removal" );
					
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 1, "1 row after removal" );
		    });
});