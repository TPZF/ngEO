var Logger = require('logger');
var SearchResultsMap = require('searchResults/map');
var SelectHandler = require('map/selectHandler');
var SearchResults = require('searchResults/model/searchResults');
var SearchResultsView = require('searchResults/view/searchResultsView');
var SearchResultsTableView = require('searchResults/view/searchResultsTableView');
var MapPopup = require('map/widget/mapPopup');
var GanttView = require('ui/ganttView');

// Private variable
var _views = {};

// Private variables used for "swipe"-effect
var dragging = false;
var dx = 0; // Delta x needed between events (could probable replace dragging boolean)
var leftPos = 0; // Current position of beginning of scrollable element
var $bottomToolbar = null;

/**
 *	Computes total <command> width (icons containing dataset names)
 */
var computeCommandWidth = function() {
	var twidth=0;
	$bottomToolbar.children().each(function() {
		twidth += $(this).outerWidth( true );
	});
	return twidth;
}

/**
 *	Clamp the given position to not overflow the borders of available datasets
 */
var clampPos = function(pos) {

	var tdiff = computeCommandWidth() - $bottomToolbar.width();
	if ( pos > tdiff )
		pos = tdiff;
	if ( pos < 0 )
		pos = 0;
	return pos;
}

/*
 * Scroll-left with the given delta
 */
var dragTo = function(delta) {
	leftPos += delta;
	$bottomToolbar.scrollLeft( clampPos(leftPos) );
}

module.exports = {

	/**
	 * Initialize the search results component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {

		$bottomToolbar = $('#bottomToolbar');

		// Create the results table view
		var tableView = new SearchResultsTableView();
		panelManager.bottom.addView(tableView);
		tableView.render();

		// Create the GanttView
		var ganttView = new GanttView();
		panelManager.bottom.addView(ganttView);
		ganttView.render();

		// Call when a new feature collection is available
		SearchResults.on('add:featureCollection', function(fc) {

			// Create the search results view
			var searchResultsView = new SearchResultsView({
				model: fc
			});
			_views[fc.id] = searchResultsView;
			$('#statusBar').append(searchResultsView.$el);
			searchResultsView.render();

			// Update the toolbar
			$bottomToolbar
				.append('<command id="result' + fc.id + '" title="'+ fc.id +'" label="' + fc.id + '" class="result" />')
				.toolbar('refresh');

			// Update the daterange slider
			var slider = $("#dateRangeSlider").data("ui-dateRangeSlider");
			if (slider) {
				slider.refresh();
			}

			// Add to status bar
			panelManager.bottom.addStatus({
				activator: '#result' + fc.id,
				$el: searchResultsView.$el,
				views: [tableView, ganttView],
				viewActivators: [searchResultsView.$el.find('#tableCB'), searchResultsView.$el.find('#ganttCB')],
				model: fc
			});

			// Add feature collection to the map
			SearchResultsMap.addFeatureCollection(fc, {
				layerName: fc.id + " Result",
				style: "results-footprint",
				hasBrowse: true
			});

			// Activate the new result
			$('#result' + fc.id).click();

			// Show user which dataset is currently selected
			dragTo($bottomToolbar.find('command:last').position().left);
		});

		// Call when a feature collection is removed
		SearchResults.on('remove:featureCollection', function(fc) {

			// WARNING : order of removal is important !

			// Update the status bar
			panelManager.bottom.removeStatus('#result' + fc.id);

			// Activate the last
			$('#bottomToolbar command:last-child').click();

			// Update the daterange slider
			var slider = $("#dateRangeSlider").data("ui-dateRangeSlider");
			if (slider) {
				slider.refresh();
			}

			// Remove the view
			_views[fc.id].remove();
			delete _views[fc.id];

			// Remove feature collection from the map
			SearchResultsMap.removeFeatureCollection(fc);
			
			// Show user which dataset is currently selected
			dragTo($bottomToolbar.find('command:last').position().left);
		});

		// Initialize the default handler
		SelectHandler.initialize();
		// Start it
		SelectHandler.start();

		// Create the popup for the map
		var mapPopup = new MapPopup('#mapContainer');
		mapPopup.close();

		// Do not stay on shopcart when a search is launched
		SearchResults.on('launch', function() {
			if ($('#shopcart').hasClass('toggle')) {
				$('#shopcart').next().click();
			}
		});
		
		this.initSwipeEffect();

		// Scroll through the datasets with mouse wheel
		$bottomToolbar.mousewheel( function(event, delta) {
			 dragTo(delta * 10);
		});
	},

	/**
	 *	Swipe-effect: click & drag to swipe though available datasets
	 */
	initSwipeEffect: function() {
		// "Swipe"-effect
		$bottomToolbar.on('mousedown', function(event) {
			// Apply swiping only if scroll is activated
			if ( $bottomToolbar.outerWidth() >= parseInt($bottomToolbar.css('max-width')) ) {
				dragging = true;
				_lastX = event.clientX;
			}
		});

		$bottomToolbar.on('mousemove', function(event) {
			if ( dragging ) {
				event.preventDefault();
				dx = _lastX - event.clientX;		
				dragTo(dx);
				_lastX = event.clientX;
			}
		});

		$('#map').on('mouseup', function(event) {
			if ( dragging ) {
				event.preventDefault();

				leftPos = clampPos($bottomToolbar.scrollLeft() + (dx * 10));
				$bottomToolbar.stop().animate({
					'scrollLeft': leftPos
				}, Math.abs(dx * 30), "easeOutQuad");
				dragging = false;
			}
			dx = 0;
		});
	}
};