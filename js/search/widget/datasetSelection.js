/**
 * DatasetSelection Widget module
 */
define( ["jquery", "backbone", "logger", 'search/model/dataSetPopulation', "search/view/datasetSelectionView", 
          "panelManager"], function($, Backbone, Logger, DataSetPopulation, DataSetSelectionView, PanelManager) {

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
/*			// Append it to the data services area
			element.append(view.$el);
			
			// Create the widget for main search view
			view.$el.ngeowidget({
				activator: '#dataset',
			});*/
			
			/**
			 * Add the search widget as left panel
			 */
			PanelManager.addPanelContent({
				element: view.$el,
				position: 'left',
				activator: '#dataset'
			});
			
			return view.$el;
			
		},//when the fetch fails display an error message and disable the datasets "button"
		// so the application is still usable and the user can still see the other menus.
		error: function(){
			$("#dataset").addClass('ui-disabled');
			Logger.error('Cannot retreive the DataSetPopulationMatrix from the server');
		}
	});

};

});
