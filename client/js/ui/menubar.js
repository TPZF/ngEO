/**
 * MenuBar module
 * Manage page and module dynamic loading
 * Page are display above the map, with transparent background.
 */

var Logger = require('logger');
/**
 * The currently active menu item
 */
var activeMenuItem = null;

/**
 * The currently active page
 */
var activePage = null;

/**
 * Cache for menu page content
 */
var pageCache = {};

/**
 * Router used by the MenuBar
 */
var router = new Backbone.Router();


/**
 * Add page content
 */
var addPageContent = function($link, $div) {
	// Wrap the page co
	if (!$link.data('nowrap')) {
		$div.children().wrapAll('<div class="menuBarPageContent"></div>');
		$div.addClass('menuBarPage');
	}
	pageCache[$link.attr('href')] = $div;
	$div.hide();
	$('#mapContainer').prepend($div);
};

/**
 * Load a page
 */
var loadPage = function($link) {

	var href = $link.attr('href');
	if ($link.data('module')) {

		// Load and intialize the module
		var Module = require($link.data('module'));

		// First build the div and add it to build content
		var $div = Module.buildElement();
		addPageContent($link, $div);
		$div.data('module', Module);
		Module.initialize($div);

	}

};

/**
 * Show a page
 */
var _showPage = function(page) {
	page.slideDown(200);
	activePage = page;
	var module = activePage.data('module');
	if (module && module.show) {
		module.show();
	}
};

/**
 * Show a link
 */
var showInternalLink = function(link) {

	var linkRef = link.attr('href');
	var page = pageCache[linkRef];
	if (page) {
		if (activePage) {
			var module = activePage.data('module');
			if (module && module.hide) {
				module.hide();
			}
			activePage.slideUp(200, function() {
				_showPage(page);
			});
		} else {
			_showPage(page);
		}
	}

	// Update active menu item
	link.addClass('active');
	if (activeMenuItem) activeMenuItem.removeClass('active');
	activeMenuItem = link;
};

/**
 * Callbacks call when a page content is loaded
 */
var onPageLoaded = function() {
	$.mobile.loading("hide");

	// Start backbone history
	var routeMatch = Backbone.history.start();

	// Go to default page if none requested
	if (!routeMatch) {
		var defaut = $("header nav").data("default");
		Backbone.history.navigate(defaut, {
			trigger: true
		});
	}

};

module.exports = {
	/**
	 * Initialize the menubar component
	 */
	initialize: function(selector) {

		var links = $(selector).find('a');

		// Traverse all the links and search if the div is not already contained in the main page
		$(selector).find('a').each(function() {
			var $this = $(this);
			var linkRef = $this.attr('href');

			// If the link is contained in the document, process it.
			if (linkRef.charAt(0) == '#') {

				// Add content if aleady in the document, otherwise load the page
				var jContent = $($this.attr('href'));
				if (jContent.length > 0) {
					addPageContent($this, jContent);

				} else {
					loadPage($this);
				}

				//TODO: HACK because we already have a router.route("data-services-area") on dsa.js
				//and the router.route("data-services-area") calls the showPage with parameter "data-services-area"
				if (linkRef.substr(1) != "data-services-area") {
					// Add a route to show the link
					router.route(linkRef.substr(1), linkRef.substr(1), function() {
						showInternalLink($this);
					});
				}

			}
		});

		onPageLoaded();
	},

	/**
	 * Show a page of the menubar
	 */
	showPage: function(name) {
		showInternalLink($('a[href=#' + name + ']'));
	}
};