define( ['jquery', 'backbone', 'configuration', "hostedProcesses/model/hostedProcessList", "hostedProcesses/view/selectHostedProcessesView", 'text!dataAccess/template/downloadManagersListContent.html',
	 'text!dataAccess/template/downloadManagerInstallContent.html'], 
		function($, Backbone, Configuration, HostedProcessList, SelectHostedProcessView, downloadManagersList_template, downloadManagerInstall_template) {

	/**
	 * This view handles the displaying of download managers and the assignment 
	 * of a download manager to a data access request either a SimpleDataAccessRequest 
	 * or a StandingOrderDataAccessRequest.
	 * It handles hosted process configuration as well.
	 * 
	 * The attribute request is the request to be submitted.
	 * 
	 */
var DataAccessRequestView = Backbone.View.extend({

	initialize : function(options){
		this.request = options.request;
		this.listenTo(this.request,'SuccessValidationRequest', this.onValidationSuccess);
		this.listenTo(this.request,'SuccessConfirmationRequest', this.onConfirmationSuccess);
		this.listenTo(this.request,'FailureRequest', this.onFailure);
		this.listenTo(this.request,'RequestNotValidEvent', this.onFailure);
		
	},
	
	events : {
		'click #validateRequest' : function(event){

			var hpIsSelected = this.selectHostedProcessView.$el.find('.selected').length > 0;
			if ( !hpIsSelected || this.selectHostedProcessView.validateParameters() )
			{
				// No hosted process selected or selected one have valide parameters
				$("#serverMessage").empty();
				this.request.downloadLocation.DownloadManagerId = this.$el.find("#downloadManagersList").val();
				this.request.downloadLocation.DownloadDirectory = this.$el.find("#downloadDirectory").val();
			
				//disable the DMs list to avoid choosing a different DM once the
				//validation request has been submitted
				this.$el.find('#downloadManagersList').selectmenu('disable');
				this.$el.find('#downloadDirectory').textinput('disable');
				
				// Submit the request
				this.request.submit();
			}
			else
			{
				$("#serverMessage").html('<p style="color: red;">Please, configure the product processing parameters first</p>');
			}
		}
	},
	
	/** change the button status to disabled in case the requests are not valid */
	onFailure : function(){
		$("#validateRequest").button('disable');
		// TODO : improve message according to the failure ?
		//NGEO 782 : fixed failure response message content
		$("#serverMessage").html("Invalid server response");
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
		//NGEO 782 : fixed failure response message content
		$("#serverMessage").html(message);
	},
	
	/**
	 * Called when the confirmation succeeds
	 */
	onConfirmationSuccess : function(serverMessage,configMessage) {
		// Disable the confirm button
		$("#validateRequest").button('disable');
		// Display the message
		//NGEO 782 : fixed failure response message content
		$("#serverMessage").html('<p>'+configMessage+'</p><p>'+serverMessage+'</p>');
		
		// NGEO-900 : close widget when finished
		this.$el.parent().ngeowidget('hide');
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
		}

		// Create hosted process list
		// Make it singleton ?
		var hostedProcessList = new HostedProcessList();

		var self = this;
		hostedProcessList.fetch()
		.done(function() {
			self.selectHostedProcessView = new SelectHostedProcessView({
				model: hostedProcessList,
				el: self.$el.find("#hostedProcesses"),
				request: self.request
			});

			self.selectHostedProcessView.render();
			self.$el.find("#hostedProcesses").trigger('create');
		})
		.fail(function() {
			self.$el.find("#hostedProcesses").html('No product processing available.');
		});

		this.$el.find("#dataAccessSpecificMessage").append(this.request.getSpecificMessage());
		//Trigger JQM styling
		this.$el.trigger('create');
		
		return this;
	}
	
});

return DataAccessRequestView;

});