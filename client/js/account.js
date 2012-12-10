
define(["jquery", "dataAccess/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", 
        "dataAccess/view/dataAccessRequestMonitoringView", "text!../pages/account.html", "tabs"], 

        function($, DataAccessRequestStatuses, DownloadManagers, DataAccessRequestMonitoringView, account_html) {
	
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
		
		DataAccessRequestStatuses.fetch().done(function(){
			
			DownloadManagers.fetch().done(function(){
			
				console.log("statuses");
				console.log(DataAccessRequestStatuses.attributes);
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