var Logger = require('logger');
var UserPrefs = require('userPrefs');
var Map = require('map/map');
var SearchDSA = require('search/dsa');
var SearchResultsDSA = require('searchResults/dsa');
var ShopcartDSA = require('shopcart/dsa');
var ToolBarMap = require('map/widget/toolbarMap');
var PanelManager = require('ui/panelManager');
var StackPanel = require('ui/stackPanel');
var StatusPanel = require('ui/statusPanel');
var dsa_template = require('../pages/data-services-area');
var Configuration = require('configuration');
require('ui/toolbar');
require('ui/dateRangeSlider');

var panelManager;
var toolbarMap;

module.exports = {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {

		var dsa = $(dsa_template({
			theme: Configuration.localConfig.theme
		}));
		dsa.find('menu[type=toolbar]').not('#bottomToolbar').toolbar();
		dsa.find('#bottomToolbar').toolbar({
			withNumber: true
		});
		return dsa;
	},

	/**
	 * Called when the module main page is hidden
	 */
	hide: function() {
		panelManager.save();
		$('.mapPopup').hide();
		$('#statusBar').hide();
		$('#dateRangeSlider').hide();
		$('#searchToolbar').hide();
		$('#mapToolbar').hide();
		$('#bottomToolbar').hide();
	},

	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		$('.mapPopup').show();
		$('#statusBar').show();

		var $dateRangeSlider = $('#dateRangeSlider');
		if ($dateRangeSlider.is(':ui-dateRangeSlider')) {
			$dateRangeSlider.show();
			$dateRangeSlider.dateRangeSlider('refresh');
		}

		$('#searchToolbar').show();
		$('#mapToolbar').show();
		$('#bottomToolbar').show();
		panelManager.restore();
	},

	/**
	 * Initialize the module.
	 * Called after buildElement
	 *
	 * @param element The root element of the module
	 */
	initialize: function(element) {

		// Create the panel manager and the panel used for the different view : search, result, table...
		panelManager = new PanelManager({
			el: '#mapContainer',
			center: '#map'
		});

		// Add left panel (use for search )
		panelManager.add('left', new StackPanel({
			el: '#left-panel',
			classes: 'ui-body-'+Configuration.localConfig.theme+' panel-content-left'
		}));

		// Add bottom panel (use for results and shopcart)
		panelManager.add('bottom', new StatusPanel({
			el: '#bottom-panel',
			classes: 'ui-body-'+Configuration.localConfig.theme+' panel-content-bottom'
		}));

		panelManager.on('centerResized', function() {
			Map.updateViewportSize();
			// TODO : improve that
			var $dateRangeSlider = $('#dateRangeSlider');
			if ($dateRangeSlider.is(':ui-dateRangeSlider')) {
				$dateRangeSlider.dateRangeSlider('refresh');
			}
		});


		// Need to add some elements to map to have good positionning.
		// Not very pretty..
		// MS: work in progress.. commented parts should be deleted at the end..
		$('#statusBar')/*.appendTo('#map')*/.hide().trigger('create');
		// $('#dateRangeSlider').appendTo('#map').hide();
		// $('#searchToolbar').appendTo('#map').hide();
		$('#mapToolbar').appendTo('#map').hide();
		$('#bottomToolbar')/*.appendTo('#map')*/.hide();

		// Create the router
		var router = new Backbone.Router();

		// Create all widgets for diferent modules
		SearchDSA.initialize(element, router, panelManager);
		SearchResultsDSA.initialize(element, router, panelManager);
		ShopcartDSA.initialize(element, router, panelManager);

		// Initialize toolbar and context help
		toolbarMap = new ToolBarMap(element);
	}
};