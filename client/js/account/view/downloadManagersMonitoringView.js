

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers', 'text!account/template/accountDownloadManagersContent.html'], 
		function($, Backbone, Configuration, DownloadManagers, downloadManagersMonitoring_template) {

var DownloadManagersMonitoringView = Backbone.View.extend({

	initialize : function(){
		this.model.on("DownloadManagerStatusChanged" , this.updateDownloadManagerStatusView, this);
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
				 this.model.requestChangeStatus(dmID, Configuration.data.downloadManager.stopCommand.value);
			 
			 }else if (event.currentTarget.id == "stop_immediately_dm"){
				 this.model.requestChangeStatus(dmID, Configuration.data.downloadManager.stopImmediatelyCommand.value);
			 
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
			
			   case Configuration.data.downloadManager.stopCommand.value : 
			   case Configuration.data.downloadManager.stopImmediatelyCommand.value : 
					$("#stop_dm").button('disable');
					$("#stop_immediately_dm").button('disable');
					this.showMessage("Cannot change status : The download manager has just been stopped ");
					break;
					
			   case undefined://no command has been submitted to the server so take into account DM status
					
					switch(status) {
				
						case Configuration.data.downloadManager.activeStatus.value :
							$("#stop_dm").button('enable');
							$("#stop_immediately_dm").button('enable');
							break;
						
						case Configuration.data.downloadManager.inactiveStatus.value :
							$("#stop_dm").button('enable');
							$("#stop_immediately_dm").button('enable');
							break;
							
						case Configuration.data.downloadManager.stoppedStatus.value :
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
				case Configuration.data.downloadManager.stopCommand.value :
				case Configuration.data.downloadManager.stopImmediatelyCommand.value :
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
	
	render: function(){
	
		var content = _.template(downloadManagersMonitoring_template, 
				_.extend({downloadManagerInstallationLink : Configuration.data.downloadManager.downloadManagerInstallationLink}, this.model.attributes));
		this.$el.append(content);
		this.$el.trigger('create');		

		$("#dm_server_response").hide();
		$("#stop_dm").button('disable');
		$("#stop_immediately_dm").button('disable');
		
		return this;
	},	
});

return DownloadManagersMonitoringView;

});
