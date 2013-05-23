define( ['jquery', 'backbone', 'configuration', 'text!dataAccess/template/downloadManagersListContent.html',
	 'text!dataAccess/template/downloadManagerInstallContent.html'], 
		function($, Backbone, Configuration, downloadManagersList_template, downloadManagerInstall_template) {

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
		this.request.on('SuccessValidationRequest', this.onValidationSuccess, this);
		this.request.on('SuccessConfirmationRequest', this.onConfirmationSuccess, this);
		this.request.on('FailureRequest', this.onFailure, this);
		this.request.on('RequestNotValidEvent', this.onFailure, this);
		
	},
	
	events : {
		'click #validateRequest' : function(event){
			$("#serverMessage").empty();
			this.request.setDownloadManager(this.selectedDownloadManager);
		
			//disable the DMs list to avoid choosing a different DM once the
			//validation request has been submitted
			$('#downloadManagersList').addClass('ui-disabled');
			
			// Submit the request
			this.request.submit();
		},
		
		'click label' : function(event){
			var $target = $(event.currentTarget);
			//look for class ui-radio-off because it is going to be changed to ui-radio-on at the end of the handler
			if ($target.hasClass("ui-radio-off")){
				this.selectedDownloadManager = event.currentTarget.id;
			}
		}
	},
	
	/** change the button status to disabled in case the requests are not valid */
	onFailure : function(){
		$("#validateRequest").button('disable');
		// TODO : improve message according to the failure ?
		$("#serverMessage").append("Invalid server response");
	},
	
	/** change the button text to highlight the request stage "Confirmation" 
	 * update the button text in the jqm span for button text to make the
	 * button text updated*/
	onValidationSuccess : function(serverMessage,configMessage) {
		$("#validateRequest").html("Confirm"); 
		$("#downloadManagersFooter .ui-btn-text").html("Confirm");
		
		var message = '<p>'+configMessage+'</p><p>'+serverMessage+'</p>';
				  
		// Display the estimated size and a warning message if the size exceeds a thresold (REQ)
		if ( this.request.totalSize ) {
			message += "<p> Estimated Size : " + this.request.totalSize + "<p>";
			if ( this.request.totalSize > Configuration.get('simpleDataAccessRequest.warningMaximumSize',1e9) ) {
				message += "<p>WARNING : The amount of data to download is huge.</p><p>Are you sure you want to confirm your request?</p>"; 
			}
		}

		$("#serverMessage").append(message);
	},
	
	/**
	 * Called when the confirmation succeeds
	 */
	onConfirmationSuccess : function(serverMessage,configMessage) {
		// Disable the confirm button
		$("#validateRequest").button('disable');
		// Display the message
		$("#serverMessage").append('<p>'+configMessage+'</p><p>'+serverMessage+'</p>');
	},	
	
	render: function(){
	
		//after the download managers are retrieved
		//if no download manager is already registered : propose a link to the user to install one
		if (this.model.attributes.downloadmanagers == 0) {
			
			var installContent = _.template(downloadManagerInstall_template, { downloadManagerInstallationLink : Configuration.data.downloadManager.downloadManagerInstallationLink,
				downloadmanagers: this.model.get('downloadmanagers')
			});
			this.$el.append( installContent );
					
		} else {
			var content = _.template(downloadManagersList_template, this.model.attributes);
			this.$el.append(content);
			//empty the status to cover the case where a user has registered a download manager after it has no one installed
			this.$el.find("#downloadManagerStatusMessage")
				.empty()
				.append("<h4>Select a Download Manager : <h4>")
				.show()
			this.$el.find("#downloadManagersList").show();
			this.$el.find("#downloadManagersFooter").show();
			
			//set the first download manager to be selected by default
			//console.log(this.$el.find('input[type="radio"]:eq(0)')[0]);
			var firstDM = $(this.$el.find('input[type="radio"]:eq(0)')[0]);
			//console.log(this.selectedDownloadManager);
			firstDM.prop("checked", true);
			this.selectedDownloadManager = firstDM.attr("value");
			//console.log(this.selectedDownloadManager);
		}

		this.$el.find("#dataAccessSpecificMessage").append(this.request.getSpecificMessage());
		//Trigger JQM styling
		this.$el.trigger('create');
		
		return this;
	}
	
});

return DownloadManagersListView;

});
