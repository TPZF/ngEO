/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/model/datasetSearch", "search/view/searchCriteriaView", 
          "widget"], function($, Backbone, DatasetSearch, SearchCriteriaView) {

	DatasetSearch.initialize();
	
	// Create the view and append it to the root element
	var view = new SearchCriteriaView({
		model : DatasetSearch,
	});
		
	return {
		
		create : function(element) {
	
			element.append(view.$el);
			
			// Create the widget to display the search criteria view
			view.$el.ngeowidget({
				activator: '#search',
			});
			
			// Disable search criteria and result buttons if there is no dataset selected
			if ( !DatasetSearch.get('datasetId') || DatasetSearch.get('datasetId') == '' ) {
				$('#search').parent().addClass('ui-disabled');
			}
			DatasetSearch.on('change:datasetId', function() {
				if ( !DatasetSearch.get('datasetId') || DatasetSearch.get('datasetId') == '' ) {
					$('#search').parent().addClass('ui-disabled');
				} else {
					$('#search').parent().removeClass('ui-disabled');
				}
			});
			
			view.render();
	
			return view.$el;
		},
		
		//refresh the view
		refresh : function(){
			view.displayDatasetRelatedViews();
		}
	};

});
