define(['jquery', 'configuration', 'ui/tableView', 'searchResults/model/searchResults'], 
        function ($, Configuration, TableView, SearchResults) {

		var view = null;
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
					// Create a view
					view = new TableView({
						model: SearchResults,
						columnDefs: columnDefs
					});
					view.render();
					view.$el.append("#qunit-fixture");
		    	},
			teardown: function() {
					SearchResults.reset();
					view.remove();
					view = null;
				}
	    });
    
	    QUnit.test("Check add features",  function () {				
				
				SearchResults._addFeatures(features);
			
				QUnit.ok( view.rowsData.length == 3, "3 Rows added" );
				QUnit.ok( view.rowsData[0][1] == "toto", "Row 1 : value ok" );
				QUnit.ok( view.rowsData[2][1] == "tutu", "Row 3 : value ok" );
				
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows build" );
		});
		
		
	    QUnit.test("Check filter features",  function () {
		
				SearchResults._addFeatures(features);
				
				view.filterData('');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows after empty filter" );
				view.filterData('toto');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 1, "1 rows after filter" );
				view.filterData('');
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows after empty filter" );
		});	
		
	    QUnit.test("Check sort features",  function () {	
		
				SearchResults._addFeatures(features);
				
				view.sortData(1,'desc');
				QUnit.ok( view.visibleRowsData[0][1] == "tutu", "sort desc works" );
				view.sortData(1,'asc');
				QUnit.ok( view.visibleRowsData[0][1] == "titi", "sort asc works" );
				view.sortData(1,'original');
				QUnit.ok( view.visibleRowsData[0][1] == "toto", "sort original works" );
		    });
    
	    QUnit.test("Check remove feature",  function () {

				SearchResults._addFeatures(features);
				
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 3, "3 rows at beginning" );

				view.removeData( [ features[0], features[2] ] );
				
				QUnit.ok( view.rowsData.length == 1, "1 row data after removal" );
				QUnit.ok( view.rowsData[0][0] == features[1], "Data ok after removal" );
					
				QUnit.ok( view.$el.find('.table-content tbody tr').length == 1, "1 row after removal" );
		    });
});