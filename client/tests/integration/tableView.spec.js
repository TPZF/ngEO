var Configuration = require('configuration');
var FeatureCollection;
var TableView;

describe("TableView test", function() {

	var fc = null;
	var view = null;
	var columnDefs = [
		{"sTitle" : "Name", "mData" : "properties.name" },
		{"sTitle" : "Date", "mData" : "properties.date"}
	];
	var features = [
		{
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

    beforeEach(function(done){
    	Configuration.url = "/client-dev/conf/"; // Use stub_server's url
    	// Load configuration
    	Configuration.load().done(function(){
    		FeatureCollection = require('searchResults/model/featureCollection');
    		TableView = require('ui/tableView');
    		done();
    	});
    });

    it("should be able to initialize", function() {
    	fc = new FeatureCollection();
		// Create a view
		view = new TableView({
			model: fc,
			columnDefs: columnDefs
		});
		view.render();
		//console.log("view",view);
    });

    it("should be able to add features", function() {
    	
    	fc.addFeatures(features);
		
		expect( view.rowsData.length ).toEqual(3);
		expect( view.rowsData[0].cellData[0] ).toBe("toto");
		expect( view.rowsData[2].cellData[0] ).toBe("tutu");
		
		expect( view.$el.find('.table-content tbody tr').length ).toEqual(3);
    });

    it("Check filter features",  function () {

		view.filterData('');
		expect( view.$el.find('.table-content tbody tr').length).toEqual(3);
		view.filterData('toto');
		expect( view.$el.find('.table-content tbody tr').length).toEqual(1);
		view.filterData('');
		expect( view.$el.find('.table-content tbody tr').length).toEqual(3);
	});	
	
    it("Check sort features",  function () {	

		view.sortData(1,'desc');
		expect( view.visibleRowsData[0].cellData[0] ).toBe("tutu");
		view.sortData(1,'asc');
		expect( view.visibleRowsData[0].cellData[0] ).toBe("titi");
		view.sortData(1,'original');
		expect( view.visibleRowsData[0].cellData[0] ).toBe("toto");
    });

    it("Check remove feature",  function () {
		expect( view.$el.find('.table-content tbody tr').length).toEqual(3);

		view.removeData( [ features[0], features[2] ] );
		
		expect( view.rowsData.length ).toEqual(1);
		expect( view.rowsData[0].feature ).toBe(features[1]);
			
		expect( view.$el.find('.table-content tbody tr').length ).toEqual(1);
    });

});