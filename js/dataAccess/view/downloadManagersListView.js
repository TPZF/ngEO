define( ['jquery', 'backbone', 'text!dataAccess/template/downloadManagersListContent.html'], 
		function($, Backbone, downloadManagersList_template) {

var DownloadManagersListView = Backbone.View.extend({

	initialize : function(options){
		this.request = options.request;
		this.parent = options.parent;
	},
	
	events : {
		'click #validateRequest' : function(event){
			$("#serverMessage").empty();
			this.request.setDownloadManager(this.selectedDownloadManager);
			//$("#serverMessage").append(this.request.getServerResponse());
			this.request.validate().done($("#serverMessage").append(this.request.serverResponse));
		},
		
		'click label' : function(event){
			var $target = $(event.currentTarget);
			//check class ui-radio-off because it is going to be chaged to ui-radio-on at the end of the handler
			if ($target.hasClass("ui-radio-off")){
				this.selectedDownloadManager = event.currentTarget.id;
				console.log("selected Download Manager :");
				console.log(this.selectedDownloadManager);
			}
		}
		
	},
	
	render: function(){
	
		console.log(this.model);

		//after the download managers are retrieved
		//if no download manager is already registred : propose a link to the user to install one
		if (this.model.attributes.downloadmanagers == 0) {
			//empty the status to cover the case where a user has stopped a download manager after it has install it
			$("#downloadManagerStatusMessage").empty();
			$("#downloadManagerStatusMessage").append("To install a Download Manager click on this link : \b <a href='TO BE DONE'/>");
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
			//$("#validateRequest").button("disable");
		}

		this.delegateEvents();
		return this;
	}
	
});

return DownloadManagersListView;

});
