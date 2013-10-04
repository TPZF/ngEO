
define(["jquery", "logger", "userPrefs", "map/map", "search/dsa", "searchResults/dsa", "shopcart/dsa",
		"map/widget/toolbarMap",
		"text!../pages/data-services-area.html", "ui/context-help", "panelManager", "ui/toolbar"], 
	function($, Logger, UserPrefs, Map, SearchDSA, SearchResultsDSA, ShopcartDSA,
			ToolBarMap, dataservicesarea, ContextHelp, PanelManager) {


return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		dsa.find('menu[type=toolbar]').toolbar({ onlyIcon: false });	
	
		return dsa;
	},
	
	/**
	 * Called when the module main page is hidden
	 */
	hide: function() {
		PanelManager.hide();
		$('#statusBar').hide();
		$('#dateRangeSlider').hide();
		$('#searchToolbar').hide();
		$('#mapToolbar').hide();
	},
	
	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		PanelManager.show();
		$('#statusBar').show();
		$('#dateRangeSlider').show();
		$('#searchToolbar').show();
		$('#mapToolbar').show();
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
			updateCenter: function() {
				Map.updateViewportSize();
				// TODO : improve that
				var $dateRangeSlider = $('#dateRangeSlider');
				if ( $dateRangeSlider.is(':ui-dateRangeSlider') ) {
					$dateRangeSlider.dateRangeSlider('refresh');
				}
			}
		});
		$('#statusBar').appendTo('#map').trigger('create');
		$('#dateRangeSlider').appendTo('#map');
		$('#searchToolbar').appendTo('#map');
		$('#mapToolbar').appendTo('#map');

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
