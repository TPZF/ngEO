/**
 * DatasetSelection Widget module
 */
define( ["jquery", "backbone", 'search/model/dataSetPopulation', "search/view/datasetSelectionView", 
          "widget"], function($, Backbone, DataSetPopulation, DataSetSelectionView) {

return function(element) {
		
	// Create the model for DataSetPopulation
	var datasetPopulation = new DataSetPopulation();
	
	// Create the main search view
	var view = new DataSetSelectionView({
		model : datasetPopulation 
	});
	
	// The dataset population is fetch only at the beginning for the moment
	// It was called every time the search widget was shown before, but it can trigger a bug!
	datasetPopulation.fetch({
		success: function() {
			view.render();
			// Append it to the data services area
			element.append(view.$el);
			
			// Create the widget for main search view
			view.$el.ngeowidget({
				title: 'DataSet Selection',
				activator: '#dataset',
			});
			
			return view.$el;
			
		},//when the fetch fails display an error message and disable the datasets "button"
		// so the application is still usable and the user can still see the other menus.
		error: function(){
			$("#dataset").addClass("ui-disabled");
			$('<div><p>Error : a error occured with DataSetPopulationMatrix interface.</p><p>Please check the server side interface and relaunch the application.</p></div>')
			.appendTo('.ui-page-active')
			.popup()
			.popup('open');
		}
	});

};

});
