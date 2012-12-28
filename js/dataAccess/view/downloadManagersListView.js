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
		this.request.on('SuccessValidationRequest', this.requestButtonTextChange, this);
		this.request.on('FailureValidationRequest', this.disableRequestButton, this);
		this.request.on('RequestNotValidEvent', this.disableRequestButton, this);
		
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
			}
		}
	},
	
	/** change the button status to disabled in case the requests are not valid */
	disableRequestButton : function(){
		$("#validateRequest").button('disable'); 
	},
	
	/** change the button text to highlight the request stage "Confirmation" 
	 * update the button text in the jqm span for button text to make the
	 * button text updated*/
	requestButtonTextChange : function(){
		$("#validateRequest").html("Confirm Your Request"); 
		$("#downloadManagersFooter .ui-btn-text").html("Confirm Your Request"); ;
	},
	
	render: function(){
	
		//after the download managers are retrieved
		//if no download manager is already registered : propose a link to the user to install one
		if (this.model.attributes.downloadmanagers == 0) {
			
			this.$el.append(downloadManagersList_template);
			//empty the status to cover the case where a user has stopped a download manager after it has install it
			this.$el.find("#downloadManagerStatusMessage")
				.empty()
				.append("<p><b>No download manager has been registered.</b></p><p><b>To install a Download Manager click on the following button : </b></p>") 
				//style the download manager installation link
				.append("<a data-mini='true' data-inline='true' data-theme='a' data-role='button' href='" +
												Configuration.data.downloadManager.downloadManagerInstallationLink + "'>" + 
												"Install Download Manager" +"</a>");
			this.$el.find("#downloadManagersList").hide();
			this.$el.find("#downloadManagersFooter").hide();
					
		}else{
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
			console.log(this.selectedDownloadManager);
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
