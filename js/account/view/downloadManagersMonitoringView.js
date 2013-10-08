

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers', 'text!account/template/accountDownloadManagersContent.html',
	 'text!dataAccess/template/downloadManagerInstallContent.html'], 
		function($, Backbone, Configuration, DownloadManagers, downloadManagersMonitoring_template, downloadManagerInstall_template) {

var DownloadManagersMonitoringView = Backbone.View.extend({

	initialize : function(){
		this.model.on("DownloadManagerStatusChanged" , this.updateDownloadManagerStatusView, this);
		this.model.on("sync" , this.render, this);
		this.model.on("error" , this.error, this);
	},
	
	events :{
		
		'click :button' : function(event){
			 
			 var node = $('tr.dm_selected');
			 //console.log(node);
			 var rowId =  $('tr.dm_selected').attr('id');
			 //console.log(rowId);
			 var dmID = rowId.substring(rowId.indexOf('_')+1, rowId.length);
			 //console.log(dmID);
			 
			 if (event.currentTarget.id == "stop_dm"){	
				 this.model.requestChangeStatus(dmID, Configuration.localConfig.downloadManager.stopCommand.value);
			 
			 }else if (event.currentTarget.id == "stop_immediately_dm"){
				 this.model.requestChangeStatus(dmID, Configuration.localConfig.downloadManager.stopImmediatelyCommand.value);
			 
			 }else{
				 //NOT SUPPORTED CASE
			 }
		},

		'click tbody tr' : function(event){
			//allow a unique row selection
			$("tr").removeClass('dm_selected');
			$(event.currentTarget).toggleClass('dm_selected');
			// each row id follows this expression: row_id where id is the related download manager id
			var rowId = event.currentTarget.id;
			var dmID = rowId.substring(rowId.indexOf('_')+1, rowId.length);
			var status = this.model.getDownloadManagerStatus(dmID);
			var recentCommand = this.model.getRecentCommand(dmID);
			
			switch (recentCommand) {
			
			   case Configuration.localConfig.downloadManager.stopCommand.value : 
			   case Configuration.localConfig.downloadManager.stopImmediatelyCommand.value : 
					$("#stop_dm").button('disable');
					$("#stop_immediately_dm").button('disable');
					this.showMessage("Cannot change status : The download manager has just been stopped ");
					break;
					
			   case undefined://no command has been submitted to the server so take into account DM status
					
					switch(status) {
				
						case Configuration.localConfig.downloadManager.activeStatus.value :
							$("#stop_dm").button('enable');
							$("#stop_immediately_dm").button('enable');
							break;
						
						case Configuration.localConfig.downloadManager.inactiveStatus.value :
							$("#stop_dm").button('enable');
							$("#stop_immediately_dm").button('enable');
							break;
							
						case Configuration.localConfig.downloadManager.stoppedStatus.value :
							$("#stop_dm").button('disable');
							$("#stop_immediately_dm").button('disable');
							break;
		
						//for Stopped or Unknown Status disable sending commands
						default :
							$("#stop_dm").button('disable');
							$("#stop_immediately_dm").button('disable');
					  		break;
						}
					break;

				//Unknown Status
				default :
					$("#stop_dm").button('disable');
					$("#stop_immediately_dm").button('disable');
					this.showMessage("Cannot change status : Error Unknown Recent command ");
			  		break;
			}
		}
	},
	/** display a notification message */
	showMessage : function(message){
		if ( this.timeOut ) {
			clearTimeout( this.timeOut );
		}
		$("#dm_server_response")
			.empty()
			.append(message)
			.slideDown();
			
		// Hide status message after a given time
		this.timeOut = setTimeout( function() {
			$("#dm_server_response").slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
	},
	
	/**call back function when a server has send back a response for a download manager
	 * status change request. the argument is an array ['SUCCESS'|'ERROR', dmI', command, 'message']
	 * In all cases display the message and only in case of a successful status change
	 * update the download manager view according to the command send.
	 */ 
	updateDownloadManagerStatusView : function(args){
		
		//display notification message
		this.showMessage(args[3])
		
		if (args[0] == 'SUCCESS'){
			
			switch (args[2]) {
				
			    //Forbid the STOP_IMMEDIATELY command after a STOP command
				case Configuration.localConfig.downloadManager.stopCommand.value :
				case Configuration.localConfig.downloadManager.stopImmediatelyCommand.value :
					$("#stop_dm").button('disable');
					$("#stop_immediately_dm").button('disable');
					break;
					
				//after Unknown command disable sending commands : should not happen
				default :				
					$("#stop_dm").button('disable');
					$("#stop_immediately_dm").button('disable');
			  		break;
			}
		}
	},
	
	/**
	 * Call when an error occurs on the server
	 */
	error: function(model, xhr) {
		if ( xhr.status == 404 ) {
			// This is normal, the user has no download managers so just render it.
			this.render();
		} else {
			this.$el.empty();
			this.$el.append("<div class='ui-error-message'><p><b> Failure: Error when loading the download managers.</p></b>"+ 
												"<p><b> Please check the interface with the server.</p></b></div>");
		}
	},
	
	/**
	 * Refresh the view size
	 * Update download manager list to have a good max height
	 */
	refreshSize: function() {
		var parentOffset = this.$el.offset();
		var $content = this.$el.find('#downloadManagersMonitoringContent');
		
		var height = $(window).height() - (parentOffset.top + this.$el.outerHeight()) + $content.height();
	
		$content.css('max-height',height);
	},
	
	/**
	 * Call to build the view when the download managers are synced
	 */
	render: function(){
	
		this.$el.empty();
	
		// Add HTML to install a download manager
		var installContent = _.template(downloadManagerInstall_template, { downloadManagerInstallationLink : Configuration.data.downloadManager.downloadManagerInstallationLink,
			downloadmanagers: this.model.get('downloadmanagers')
		});
		this.$el.append(installContent);
		
		// Add HTML for monitoring download managers if there is any
		if ( this.model.get('downloadmanagers').length > 0 ) {
			var content = _.template(downloadManagersMonitoring_template, this.model.attributes);
			this.$el.append(content);
		}
		this.$el.trigger('create');		

		$("#dm_server_response").hide();
		$("#stop_dm").button('disable');
		$("#stop_immediately_dm").button('disable');
		
		this.refreshSize();
				
		return this;
	},	
});

return DownloadManagersMonitoringView;

});
