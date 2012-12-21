
define(["jquery", "configuration", "dataAccess/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", "dataAccess/view/dataAccessRequestMonitoringView", 
        "dataAccess/view/downloadManagersMonitoringView", "text!../pages/account.html", "tabs"], 

        function($, Configuration, DataAccessRequestStatuses, DownloadManagers, DataAccessRequestMonitoringView, DownloadManagersMonitoringView, account_html) {
	
return {

	/**
	 * Build the root element of the module and return it
	 */
	
	buildElement: function() {
	
		var acc = $(account_html);
		acc.find('#tabs').tabs({ 
			theme: "b" 
		});
		return acc;
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 */
	initialize: function() {
		
		DownloadManagers.fetch().done(function(){
			
			// create the download managers monitoring view
			var dmView = new DownloadManagersMonitoringView({
				model : DownloadManagers,
				el : "#downloadManagersMonitoring"
			});
			
			dmView.render();
			
			DataAccessRequestStatuses.set({collapseDAR : Configuration.data.dataAccessRequestStatuses.collapseDAR,
				collapseProducts : Configuration.data.dataAccessRequestStatuses.collapseProducts});

			//create the DARs monitoring view
			DataAccessRequestStatuses.fetch().done(function(){
				
				//console.log("statuses");
				//console.log(DataAccessRequestStatuses.attributes);
				var darView = new DataAccessRequestMonitoringView({
					model : DataAccessRequestStatuses,
					el : "#DARMonitoring"
				});
				
				darView.render();
			});
			
		});
		
	}
};

});