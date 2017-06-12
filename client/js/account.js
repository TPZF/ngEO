var Configuration = require('configuration');
var Logger = require('logger');
var DataAccessRequestStatuses = require('account/model/dataAccessRequestStatuses');
var DownloadManagers = require('dataAccess/model/downloadManagers');
var ShopcartCollection = require('shopcart/model/shopcartCollection');
var DataAccessRequestMonitoringView = require('account/view/dataAccessRequestMonitoringView');
var DownloadManagersMonitoringView = require('account/view/downloadManagersMonitoringView');
var ShopcartManagerView = require('account/view/shopcartManagerView');
// var InquiriesView = require('account/view/inquiriesView');
var UserPrefsView = require('account/view/userPrefsView');
var LayerManagerView = require('account/view/layerManagerView');
var account_template = require('../pages/account');
require('ui/tabs');



// Private variable : the different view of My Account page	
var dmView;
var darView;
// var inquiriesView;
var userPrefsView;
var shopcartManagerView;

var activeView;

var refreshViewOnResize = _.debounce(function() {
	if (activeView.refreshSize) activeView.refreshSize();
}, 300);

// Function call when a tab is activated
var onTabActivated = function($link) {

	switch ($link.attr('href')) {
		case "#downloadManagersMonitoring":
			DownloadManagers.fetch();
			activeView = dmView;
			break;
		case "#DARMonitoring":
			DataAccessRequestStatuses.fetch();
			activeView = darView;
			break;
		case "#userPrefs":
			activeView = userPrefsView;
			break;
		// case "#inquiries":
		// 	activeView = inquiriesView;
		// 	break;
		case "#shopcarts":
			ShopcartCollection.fetch();
			activeView = shopcartManagerView;
			break;
		case "#layerManager":
			activeView = layerManagerView;
			break;
	}

	if (activeView.refreshSize) activeView.refreshSize();
};

module.exports = {

	/**
	 * Build the root element of the module and return it
	 */

	buildElement: function() {
		var account_html = account_template(Configuration.localConfig.contextHelp);
		var acc = $(account_html);
		acc.find('#tabs').tabs({
			theme: "b",
			activate: onTabActivated
		});
		if (!Configuration.data.downloadManager.enable) {
			acc.find('a[href="#downloadManagersMonitoring"]').parent().hide();
			acc.find('a[href="#DARMonitoring"]').parent().hide();
		}
		if (!Configuration.data.behindSSO) {
			acc.find('a[href="#shopcarts"]').parent().hide();
		}
		return acc;
	},

	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		if (activeView.refreshSize)
			activeView.refreshSize();
	},

	/**
	 * Initialize the module.
	 * Called after buildElement
	 */
	initialize: function() {

		$(window).resize(refreshViewOnResize);

		if (Configuration.data.downloadManager.enable) {
			// Create the download managers monitoring view
			dmView = new DownloadManagersMonitoringView({
				model: DownloadManagers,
				el: "#downloadManagersMonitoring"
			});
			dmView.render();

			// Create the view to monitor data access requests
			darView = new DataAccessRequestMonitoringView({
				model: DataAccessRequestStatuses,
				el: "#DARMonitoring"
			});

			// Fetch data for DM
			DownloadManagers.fetch();

			DataAccessRequestStatuses.set({
				collapseDAR: Configuration.data.dataAccessRequestStatuses.collapseDAR,
				collapseProducts: Configuration.data.dataAccessRequestStatuses.collapseProducts
			});

			// Fetch DAR : maybe not needed right now
			DataAccessRequestStatuses.fetch();
		}
		if (Configuration.data.behindSSO) {
			//Create the shopcart manager view 
			shopcartManagerView = new ShopcartManagerView({
				model: ShopcartCollection,
				el: "#shopcarts"
			});
			shopcartManagerView.render();
		}
		// NGEO-1967: Replace inquiries view by "Contact Us" link
		// //Create the inquiries View
		// inquiriesView = new InquiriesView({
		// 	//model : inquiery,
		// 	el: "#inquiries"
		// });
		// inquiriesView.render();

		//Create the user prefs View
		userPrefsView = new UserPrefsView({
			el: "#userPrefs"
		});
		userPrefsView.render();

		//Create wms manager view
		layerManagerView = new LayerManagerView({
			el: "#layerManager"
		});
		layerManagerView.render();

		// The first active is download manager monitoring
		// if downloadManager is enable
		if (Configuration.data.downloadManager.enable) {
			activeView = dmView;
		} else if (Configuration.data.behindSSO) {
			activeView = shopcartManagerView;
		} else {
			activeView = userPrefsView;
		}

	}

};