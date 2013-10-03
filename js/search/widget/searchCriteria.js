/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/model/datasetSearch", "search/view/searchCriteriaView", 
          "panelManager"], function($, Backbone, DatasetSearch, SearchCriteriaView, PanelManager) {

	// Create the view and append it to the root element
	var view = new SearchCriteriaView({
		model : DatasetSearch,
	});
		
	return {
		
		create : function(element) {
	
			/*element.append(view.$el);
			
			// Create the widget to display the search criteria view
			view.$el.ngeowidget({
				activator: '#search',
			});*/
					
			/**
			 * Add the search widget as left panel
			 */
			PanelManager.addPanelContent({
				element: view.$el,
				position: 'left',
				activator: '#search'
			});

			
			// Disable search criteria and result buttons if there is no dataset selected
			if ( !DatasetSearch.get('datasetId') || DatasetSearch.get('datasetId') == '' ) {
				$('#search').addClass('ui-disabled');
			}
			DatasetSearch.on('change:datasetId', function() {
				if ( !DatasetSearch.get('datasetId') || DatasetSearch.get('datasetId') == '' ) {
					$('#search').addClass('ui-disabled');
				} else {
					$('#search').removeClass('ui-disabled');
				}
			});
			
			view.render();
	
			return view.$el;
		},
		
		//refresh the view
		refresh : function(){
			view.displayDatasetRelatedViews( DatasetSearch.dataset );
		}
	};

});
