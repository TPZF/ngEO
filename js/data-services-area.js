
define(["jquery", "logger", "userPrefs", "map/map", "search/dsa", "searchResults/dsa", "shopcart/dsa",
		"map/widget/toolbarMap",
		"text!../pages/data-services-area.html", "context-help", "panelManager", "toolbar"], 
	function($, Logger, UserPrefs, Map, SearchDSA, SearchResultsDSA, ShopcartDSA,
			ToolBarMap, dataservicesarea, ContextHelp, PanelManager) {


return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		dsa.find('#toolbar').toolbar({ onlyIcon: false });	
	
		return dsa;
	},
	
	/**
	 * Called when the module main page is hidden
	 */
	hide: function() {
		PanelManager.hide();
		$('#statusBar').hide();
		$('#dateRangeSlider').hide();
	},
	
	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		PanelManager.show();
		$('#statusBar').show();
		$('#dateRangeSlider').show();
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 *
	 * @param element The root element of the module
	 */
	initialize: function(element) {
	
		// Initialize the panel manager on the map
		PanelManager.initialize({
			center: '#map', 
			bottom: '#bottom-panel',
			left: '#left-panel',
			updateCenter: Map.updateViewportSize
		});
		$('#statusBar').appendTo('#map').trigger('create');
		$('#dateRangeSlider').appendTo('#map');
	
		// Hide/show widgets
		element.trigger('create');
		$('#showHideToolbar').click( { hide: true }, function(event) {
			if ( event.data.hide ) {
				$('#toolbar').hide();
				$('#statusBar').hide();
				$('#dateRangeSlider').hide();
				$(this).buttonMarkup({ icon: 'plus' });
			} else {
				$('#toolbar').show();
				$('#statusBar').show();
				$('#dateRangeSlider').show();
				$(this).buttonMarkup({ icon: 'minus' });
			}
			event.data.hide = !event.data.hide;			
		});
		
		// Create the router
		var router = new Backbone.Router();

		// Create all widgets for diferent modules
		SearchDSA.initialize( element, router );
		SearchResultsDSA.initialize( element, router );
		ShopcartDSA.initialize( element, router );
		
		// Initialize toolbar and context help
		ToolBarMap(element);
		ContextHelp(element);
		
	},
};

});
