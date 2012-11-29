define( ['jquery', 'backbone', 'configuration', 'text!dataAccess/template/downloadManagersListContent.html'], 
		function($, Backbone, Configuration, downloadManagersList_template) {

	/**
	 * This view handles the displaying of download managers and the assignment 
	 * of a download manager to a data access request either a SimpleDataAccessRequest 
	 * or a StandingOrderDataAccessRequest.
	 * 
	 * The attribute request is the request to be submitted.
	 * 
	 */
var DownloadManagersListView = Backbone.View.extend({

	initialize : function(options){
		this.request = options.request;
		this.selectedDownloadManager = options.selectedDownloadManager;
		this.request.on('toggleRequestButton', this.toggleRequestButton, this);
	},
	
	events : {
		'click #validateRequest' : function(event){
			$("#serverMessage").empty();
			this.request.setDownloadManager(this.selectedDownloadManager);
		
			var self = this;
			//when the request has been submitted update the text to the user
			$.when(this.request.submit()).done(function(){
				$("#serverMessage").append(self.request.serverResponse);
			});
		},
		
		'click label' : function(event){
			var $target = $(event.currentTarget);
			//look for class ui-radio-off because it is going to be changed to ui-radio-on at the end of the handler
			if ($target.hasClass("ui-radio-off")){
				this.selectedDownloadManager = event.currentTarget.id;
				console.log("selected Download Manager :");
				console.log(this.selectedDownloadManager);
			}
		}
	},
	
	/** change the button status to disabled in case the requests are not valid */
	toggleRequestButton : function(params){
		$("#validateRequest").button(params[0]); 
	},
	
	render: function(){
	
		console.log(this.model);

		//after the download managers are retrieved
		//if no download manager is already registred : propose a link to the user to install one
		if (this.model.attributes.downloadmanagers == 0) {
			//empty the status to cover the case where a user has stopped a download manager after it has install it
			$("#downloadManagerStatusMessage").empty();
			$("#downloadManagerStatusMessage").append("To install a Download Manager click on this link : " + Configuration.downloadManager.downloadManagerInstallationLink);
			$("#downloadManagersList").hide();
			$("#downloadManagersFooter").hide();
					
		}else{
			var content = _.template(downloadManagersList_template, this.model.attributes);
			this.$el.append(content);
			//empty the status to cover the case where a user has registred a download manager after it has no one installed
			$("#downloadManagerStatusMessage").empty();
			$("#downloadManagerStatusMessage").append("<h4>Select a Download Manager : <h4>");
			$("#downloadManagersList").show();
			$("#downloadManagersFooter").show();
		}

		this.delegateEvents();
		return this;
	}
	
});

return DownloadManagersListView;

});
