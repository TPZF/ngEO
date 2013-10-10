
define(["jquery", "configuration", "logger", "account/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", "account/view/dataAccessRequestMonitoringView", 
        "account/view/downloadManagersMonitoringView", "account/view/inquiriesView", "account/view/userPrefsView",
        "text!../pages/account.html", "ui/tabs"], 

        function($, Configuration, Logger, DataAccessRequestStatuses, DownloadManagers,
        		DataAccessRequestMonitoringView, DownloadManagersMonitoringView, InquiriesView, UserPrefsView, account_html) {
	
// Private variable : the different view of My Account page	
var dmView;
var darView;
var inquiriesView;
var userPrefsView;

var activeView;

var refreshViewOnResize = _.debounce( function() { if (activeView.refreshSize)  activeView.refreshSize(); }, 300 );

// Function call when a tab is activated
var onTabActivated = function($link) {
	if ( $link.attr('href') == "#downloadManagersMonitoring" ) {
		DownloadManagers.fetch();
		activeView = dmView;
	} else if ( $link.attr('href') == "#DARMonitoring" ) {
		DataAccessRequestStatuses.fetch();
		activeView = darView;
	} else if ( $link.attr('href') == "#userPrefs" ) {
		activeView = userPrefsView;
	} else if ( $link.attr('href') == "#inquiries" ) {
		activeView = inquiriesView;
	}
	
	if (activeView.refreshSize) activeView.refreshSize();
};

return {

	/**
	 * Build the root element of the module and return it
	 */
	
	buildElement: function() {
	
		var acc = $(account_html);
		acc.find('#tabs').tabs({ 
			theme: "b",
			activate: onTabActivated
		});
		return acc;
	},
	
	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		if (activeView.refreshSize) activeView.refreshSize();
	},	
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 */
	initialize: function() {
	
		$(window).resize( refreshViewOnResize );
	
		// Create the download managers monitoring view
		dmView = new DownloadManagersMonitoringView({
			model : DownloadManagers,
			el : "#downloadManagersMonitoring"
		});	
				
		// Create the view to monitor data access requests
		darView = new DataAccessRequestMonitoringView({
							model : DataAccessRequestStatuses,
							el : "#DARMonitoring"
						});
				
		//Create the inquiries View
		inquiriesView = new InquiriesView({
			//model : inquiery,
			el : "#inquiries"
		});
		inquiriesView.render();
		
		//Create the user prefs View
		userPrefsView = new UserPrefsView({
			el : "#userPrefs"
		});	
		userPrefsView.render();
		
		// Fetch data for DM
		DownloadManagers.fetch();
		
		DataAccessRequestStatuses.set({collapseDAR : Configuration.data.dataAccessRequestStatuses.collapseDAR,
			collapseProducts : Configuration.data.dataAccessRequestStatuses.collapseProducts});
			
		// Fetch DAR : maybe not needed right now
		DataAccessRequestStatuses.fetch();
		
		// The first active is download manager monitoring
		activeView = dmView;
	}
		
};

});