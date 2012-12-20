

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers', 'text!dataAccess/template/accountDownloadManagersContent.html'], 
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
			 
			 if (event.currentTarget.id == "enable_dm"){	
				 this.model.requestChangeStatus(dmID, "ACTIVE");
			 
			 }else if (event.currentTarget.id == "disable_dm"){
				 this.model.requestChangeStatus(dmID, "INACTIVE");
			 
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
			//console.log("dmID : ");
			//console.log(dmID);
			var status = this.model.getDownloadManagerStatus(dmID);
			//console.log(status);
			//manage buttons statuses according to download manager status
			switch(status) {
			
				case 'ACTIVE' :
					$("#enable_dm").button('disable');
					$("#disable_dm").button('enable');
					break;
				
				case 'INACTIVE'  :
					$("#enable_dm").button('enable');
					$("#disable_dm").button('disable');
					break;

				//Unknown Status
				default :
					$("#enable_dm").button('disable');
					$("#disable_dm").button('disable');
			  		break;
			}
			//display no message when no command has been triggered
			$("#dm_server_response").empty();
		}
	},
	
	//TODO refactor to create a new sub view for the each download manager row
	/**call back function when a server has send back a response for a download manager
	 * status change request. the argument is an array ['SUCCESS'|'ERROR', dmI', newStatus, 'message']
	 * In all cases display the message and only in case of a successful status change
	 * update the download manager view.
	 */ 
	updateDownloadManagerStatusView : function(args){
		
		// Clean-up the timeout for hiding of status message
		if ( this.timeOut ) {
			clearTimeout( this.timeOut );
		}
		$("#dm_server_response")
			.empty()
			.append(args[3])
			.slideDown();
			
		// Hide status message after a given time
		this.timeOut = setTimeout( function() {
			$("#dm_server_response").slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
		
		if (args[0] == 'SUCCESS'){
			
			var iconCell = $('.dm_selected').find("td:eq(0)");
			console.log(iconCell);
			//find the status cell
			var statusCell = $('.dm_selected').find("td:eq(3)");
			console.log(statusCell);
			iconCell.empty();
			//update the status cell with the new value
			statusCell.empty();
			statusCell.append(args[2]);
			
			switch (args[2]) {
				
				case 'ACTIVE' :
					
					iconCell.append('<span class="ui-icon-processing ui-icon ui-shadow">&nbsp;</span>');
					$("#enable_dm").button('disable');
					$("#disable_dm").button('enable');
					break;
				
				case 'INACTIVE'  :
					iconCell.append('<span class="ui-icon-cancelled ui-icon ui-shadow">&nbsp;</span>');
					$("#enable_dm").button('enable');
					$("#disable_dm").button('disable');
					break;
		
				//Unknown Status
				default :
					iconCell.append('<span class="ui-icon-unknown ui-icon ui-shadow">&nbsp;</span>');
					$("#enable_dm").button('disable');
					$("#disable_dm").button('disable');
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
		$("#enable_dm").button('disable');
		$("#disable_dm").button('disable');
		
		return this;
	},	
});

return DownloadManagersMonitoringView;

});
