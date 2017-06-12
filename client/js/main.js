/**
 * Main ngEO module
 */

"use strict";

var Configuration = require('configuration');
var MenuBar = require('ui/menubar');
var ContextHelp = require('ui/context-help');
var Logger = require('logger');

module.exports = {

	initialize: function init() {
		/** Use a defered object for document ready */
		var doc_ready = $.Deferred();

		// Remove history to avoid popups refreshing the page on close (related to migration of jqm from 1.2 to 1.3)
		// For more details see: http://stackoverflow.com/questions/11907944/closing-jquery-mobile-new-popup-cause-page-to-refresh-uselessly
		// TODO: find better solution
		$.mobile.popup.prototype.options.history = false;
		// Set it to false, to avoid breaking the route by Backbone
		$.mobile.hashListeningEnabled = false;

		// NGEO-1774: Check if the request contains "sharedUrl" parameter
		// TODO: Replace sharedUrl value by shared parameters to avoid another redirection
		var sharedUrlIndex = window.location.search.indexOf("sharedUrl=");
		if (sharedUrlIndex > 0) {
			// Redirect to the given shared url
			var sharedUrl = window.location.search.substr(sharedUrlIndex + "sharedUrl=".length);
			sharedUrl = decodeURIComponent(sharedUrl);
			window.location = sharedUrl;
		}

		/**
		 * When the document is ready and configuration is loaded load the rest of the application
		 */
		$.when(doc_ready, Configuration.load(), Configuration.checkBehindSso())
			.done(function() {

				// Update mailto coordinates
				$("body .contactUs").attr("href", "mailto:" + Configuration.get("mailto"));

				var Map = require('map/map');
				$.mobile.loading("show");

				// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
				$("body").removeClass("ui-mobile-viewport");
				$("header").find("a").removeClass("ui-link");
				// Initialize map
				Map.initialize("map");
				// Load the map module and initialize it

				// Initialize menu bar
				MenuBar.initialize("header nav");

				/*$.mobile.activePage.find('#helpToolbar').toolbar({
					onlyIcon: false
				});
				ContextHelp($.mobile.activePage);*/
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				Logger.error('Cannot load configuration : ' + errorThrown);
			});


		// When the document is ready, resolve the deferred object
		$(document).ready(doc_ready.resolve);
	}

};