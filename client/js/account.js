
define(["jquery", "configuration", "logger", "account/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", "shopcart/model/shopcartCollection", "account/view/dataAccessRequestMonitoringView", 
        "account/view/downloadManagersMonitoringView", "account/view/shopcartManagerView", "account/view/inquiriesView", "account/view/userPrefsView", "account/view/wmsManagerView",
        "text!../pages/account.html", "ui/tabs"], 

        function($, Configuration, Logger, DataAccessRequestStatuses, DownloadManagers, ShopcartCollection,
        		DataAccessRequestMonitoringView, DownloadManagersMonitoringView, ShopcartManagerView, InquiriesView, UserPrefsView, WmsManagerView, account_template) {
	
// Private variable : the different view of My Account page	
var dmView;
var darView;
var inquiriesView;
var userPrefsView;
var shopcartManagerView;

var activeView;

var refreshViewOnResize = _.debounce( function() { if (activeView.refreshSize)  activeView.refreshSize(); }, 300 );

// Function call when a tab is activated
var onTabActivated = function($link) {

	switch ( $link.attr('href') ) {
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
		case "#inquiries":
			activeView = inquiriesView;
			break;
		case "#shopcarts":
			ShopcartCollection.fetch();
			activeView = shopcartManagerView;
			break;
		case "#wmsManager":
			activeView = wmsManagerView;
			break;
	}
	
	if (activeView.refreshSize) activeView.refreshSize();
};

return {

	/**
	 * Build the root element of the module and return it
	 */
	
	buildElement: function() {
		var account_html = _.template(account_template, Configuration.localConfig.contextHelp);
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
		if (activeView.refreshSize)
			activeView.refreshSize();
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
		dmView.render();
				
		// Create the view to monitor data access requests
		darView = new DataAccessRequestMonitoringView({
							model : DataAccessRequestStatuses,
							el : "#DARMonitoring"
						});
		
		//Create the shopcart manager view 
		shopcartManagerView = new ShopcartManagerView({
			model : ShopcartCollection,
			el : "#shopcarts"
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
		
		//Create wms manager view
		wmsManagerView = new WmsManagerView({
			el : "#wmsManager"
		});
		wmsManagerView.render();

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