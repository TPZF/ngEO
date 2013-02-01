
define(["jquery", "configuration", "account/model/dataAccessRequestStatuses", 
        "dataAccess/model/downloadManagers", "account/view/dataAccessRequestMonitoringView", 
        "account/view/downloadManagersMonitoringView", "account/view/inquiriesView",
        "text!../pages/account.html", "tabs"], 

        function($, Configuration, DataAccessRequestStatuses, DownloadManagers, 
        		DataAccessRequestMonitoringView, DownloadManagersMonitoringView, InquiriesView, account_html) {
	
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
		
		DownloadManagers.fetch({
				
			success : function(){
			
				//remove any error message if any
				$("#downloadManagersMonitoring").empty();
				
				// create the download managers monitoring view
				var dmView = new DownloadManagersMonitoringView({
					model : DownloadManagers,
					el : "#downloadManagersMonitoring"
				});
				
				dmView.render();
				
				DataAccessRequestStatuses.set({collapseDAR : Configuration.data.dataAccessRequestStatuses.collapseDAR,
					collapseProducts : Configuration.data.dataAccessRequestStatuses.collapseProducts});
	
				//create the DARs monitoring view
				DataAccessRequestStatuses.fetch({
					
					success : function(){
						//remove any error message if any
						$("#DARMonitoring").empty();
						//console.log("statuses");
						//console.log(DataAccessRequestStatuses.attributes);
						var darView = new DataAccessRequestMonitoringView({
							model : DataAccessRequestStatuses,
							el : "#DARMonitoring"
						});
						
						darView.render();
					},
					//Handle the case when the loading of DARS has failed
					error : function(){
						$("#DARMonitoring").empty();
						$("#DARMonitoring").append("<div class='ui-error-message'><p><b> Failure: Error when loading the data access requests.</p></b>" + 
								"<p><b> Please check the interface with the server.</p></b></div>");
					}
				});	
			},
			//Handle the case when the loading of download managers has failed
			error : function(){
				$("#downloadManagersMonitoring").empty();
				$("#downloadManagersMonitoring").append("<div class='ui-error-message'><p><b> Failure: Error when loading the download managers.</p></b>"+ 
												"<p><b> Please check the interface with the server.</p></b></div>");
				$("#DARMonitoring").empty();
				$("#DARMonitoring").append("<div class='ui-error-message'><p><b> Failure: Error when loading the download managers.</p></b>" + 
						"<p><b> The data access requests cannot be displayed.</p></b></div>");

				$('<div><p>Error : An error occured when loading the download managers for My account.</p>' + 
						'<p>Please check the server side interface.</p></div>')
				.appendTo('.ui-page-active')
				.popup()
				.popup('open');
			
			}
		});
		
		//Create the inquiries View
		var inquiriesView = new InquiriesView({
			//model : inquiery,
			el : "#inquiries"
		});
		
		inquiriesView.render();
		
	}
		
};

});