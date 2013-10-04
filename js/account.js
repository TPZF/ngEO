
define(["jquery", "configuration", "logger", "account/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", "shopcart/model/shopcartCollection", "account/view/dataAccessRequestMonitoringView", 
        "account/view/downloadManagersMonitoringView", "account/view/shopcartManagerView", "account/view/inquiriesView", "account/view/userPrefsView",
        "text!../pages/account.html", "ui/tabs"], 

        function($, Configuration, Logger, DataAccessRequestStatuses, DownloadManagers, ShopcartCollection,
        		DataAccessRequestMonitoringView, DownloadManagersMonitoringView, ShopcartManagerView, InquiriesView, UserPrefsView, account_html) {
	
	
// Function call when a tab is activated
var onTabActivated = function($link) {
	if ( $link.attr('href') == "#downloadManagersMonitoring" ) {
		DownloadManagers.fetch();
	} else if ( $link.attr('href') == "#DARMonitoring" ) {
		DataAccessRequestStatuses.fetch();
	} else if ( $link.attr('href') == "#shopcarts" ) {
		ShopcartCollection.fetch();
	}
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
	 * Initialize the module.
	 * Called after buildElement
	 */
	initialize: function() {
	
	
		// Create the download managers monitoring view
		var dmView = new DownloadManagersMonitoringView({
			model : DownloadManagers,
			el : "#downloadManagersMonitoring"
		});	
				
		// Create the view to monitor data access requests
		var darView = new DataAccessRequestMonitoringView({
							model : DataAccessRequestStatuses,
							el : "#DARMonitoring"
						});
		
		//Create the shopcart manager view 
		var shopcartManagerView = new ShopcartManagerView({
			model : ShopcartCollection,
			el : "#shopcarts"
		});
		
		//Create the inquiries View
		var inquiriesView = new InquiriesView({
			//model : inquiery,
			el : "#inquiries"
		});
		inquiriesView.render();
		
		//Create the user prefs View
		var userPrefsView = new UserPrefsView({
			el : "#userPrefs"
		});	
		userPrefsView.render();
		
		// Fetch data for DM
		DownloadManagers.fetch();
		
		DataAccessRequestStatuses.set({collapseDAR : Configuration.data.dataAccessRequestStatuses.collapseDAR,
			collapseProducts : Configuration.data.dataAccessRequestStatuses.collapseProducts});
			
		// Fetch DAR : maybe not needed right now
		DataAccessRequestStatuses.fetch();
	}
		
};

});