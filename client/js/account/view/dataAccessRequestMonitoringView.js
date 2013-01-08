define(
		[ 'jquery', 'backbone', 'configuration', 'text!account/template/accountDARsContent.html',
		  'text!account/template/dataAccessRequestMonitoringContent.html'],
	
	function($, Backbone, Configuration, accountDARs_template, DAR_monitoring_template) {
		
		var DataAccessRequestMonitoringView = Backbone.View.extend({

			initialize : function(){
				this.model.on("DARStatusChanged" , this.updateDARStatusView, this);
				//orderedStatuses is the model for the monitoring view, it wrappes the DataAccessRequestStatuses model
				//and the orderedStatusesToDisplay which the array of the DARs to be displayed.
				//It is useful to update the orderedStatusesToDisplay according the DM selected.
				this.orderedStatuses = { orderedStatusesToDisplay : this.model.getOrderedStatuses(),
										 model : this.model};
			},
			
			events : {
				'click button' : function(event){
					var buttonId = event.currentTarget.id;
					//console.log($('#'+ event.currentTarget.id));
					//the stop and pause buttons ids follow expressions stop_id and pause_id 
					//where is is the related dar id
					var darId = buttonId.substring(buttonId.indexOf(Configuration.localConfig.fieldIdSuffixSepartor)+1, buttonId.length);
					var validStatusesConfig = Configuration.localConfig.dataAccessRequestStatuses.validStatuses;
					
					if (buttonId.indexOf(Configuration.localConfig.dataAccessRequestStatuses.stopButtonSuffix) == 0){//stop button is clicked
						this.model.requestChangeStatus(darId, validStatusesConfig.cancelledStatus.value);
					
					}else if (buttonId.indexOf(Configuration.localConfig.dataAccessRequestStatuses.pauseButtonSuffix) == 0){//pause button triggered to pause and resume actions
						// if the DAR is processing changed it to paused else if it is paused changed it to processing
						if (this.model.getDARStatusById(darId).status == validStatusesConfig.inProgressStatus.value){
							this.model.requestChangeStatus(darId, validStatusesConfig.pausedStatus.value);
						}else if (this.model.getDARStatusById(darId).status == validStatusesConfig.pausedStatus.value){
							this.model.requestChangeStatus(darId, validStatusesConfig.inProgressStatus.value);
						}else{
							//not supported case : should not happen !
						}
					}else{
						//not supported case : should not happen !
					}
				},
				
				'click li' : function(event){
					//console.log($('#'+ event.currentTarget.id));
					var target = $('#'+ event.currentTarget.id);
					var filtredStatuses;
					
					if ( target.hasClass('ui-btn-active') ) {
						target.removeClass('ui-btn-active');
						this.selectedDownloadManagertId = undefined;
						//no Download manager is selected so get the whole list of DARs
						this.orderedStatuses.orderedStatusesToDisplay = this.model.getOrderedStatuses();
						//empty the tab content and the redraw the whole list since no DM is selected 
						$("#DARMonitoring").empty();
						this.render();
						
				    } else {
					  
				    	this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
				    	target.addClass('ui-btn-active');
				    	this.selectedDownloadManagertId = event.currentTarget.id;
				    	//set up the list of DARs according to the selected Download manager
				    	this.orderedStatuses.orderedStatusesToDisplay = this.model.getFilterOrderedStatuses(this.selectedDownloadManagertId);
				    	//the update view method is used rather than render method in order to keep the status of the download manager
				    	//selected in the list and just update the list and not all the view.
				    	this.updateView();
				    }
				}
			},
			
			/** Call back method called after a DAR status change response received from the server.  
			 * The method changes the DAR icon and the status of the buttons according to the new changed status of the DAR */
			updateDARStatusView : function(args){

				var darId = args[1];
				var messageEltId  = "#serverDARMonitoringResponse_" + darId;
				this.showMessage(args[3], messageEltId);
				
				if (args[0] == 'SUCCESS'){
					
					var selector = "div[id='" + darId + "']";
//					console.log("selector");
//					console.log(selector);	
					var darDiv = $("#darsDiv").find(selector);
					var collapsibleHeader = darDiv.find(".ui-btn-inner:eq(0)");	
					var pauseButton = darDiv.find("button[id='pause_" + darId + "']");
					var stopButton = darDiv.find("button[id='stop_" + darId + "']");
					var validStatusesConfig = Configuration.localConfig.dataAccessRequestStatuses.validStatuses;
					
					//remove the old status string
					darDiv.find("tbody tr:eq(0) td:eq(1)").empty();
					
					switch (args[2]) {
						
						case validStatusesConfig.inProgressStatus.value : //processing triggered by clicking on resume
							
							collapsibleHeader.find("span .ui-icon-paused").remove();
							collapsibleHeader.append('<span class="ui-icon-processing ui-icon ui-shadow">&nbsp;</span>');
							pauseButton.html("Pause"); 
							  //update the text in the span added by JQM to make the change effective
							pauseButton.prev().find(".ui-btn-text").html("Pause"); 
							darDiv.find("tbody tr:eq(0) td:eq(1)").append(validStatusesConfig.inProgressStatus.status);
							break;
						
						case validStatusesConfig.pausedStatus.value :// paused triggered by clicking on pause and the old status was processing
							
							collapsibleHeader.find("span .ui-icon-processing").remove();
							collapsibleHeader.append('<span class="ui-icon-paused ui-icon ui-shadow">&nbsp;</span>');
							pauseButton.html("Resume"); 
							//update the text in the span added by JQM to make the change effective
							pauseButton.prev().find(".ui-btn-text").html("Resume"); 
							darDiv.find("tbody tr:eq(0) td:eq(1)").append(validStatusesConfig.pausedStatus.status);
							break;
				
						case validStatusesConfig.cancelledStatus.value :// cancelled triggered by clicking on stop 
							//definitively and the old status was processing or paused
							collapsibleHeader.find("span .ui-icon-processing").remove();
							collapsibleHeader.find("span .ui-icon-paused").remove();
							collapsibleHeader.append('<span class="ui-icon-cancelled ui-icon ui-shadow">&nbsp;</span>');
							pauseButton.button('disable'); 
							stopButton.button('disable');
							darDiv.find("tbody tr:eq(0) td:eq(1)").append(validStatusesConfig.cancelledStatus.status);
							break;
						//Unknown Status
						default :
							iconCell.append('<span class="ui-icon-unknown ui-icon ui-shadow">&nbsp;</span>');
							pauseButton.button('disable');
							stopButton.button('disable');
							darDiv.find("tbody tr:eq(0) td:eq(1)").append("unkown");
					  		break;
					}
				}
			},
		
			/** display a notification message inside the given elementId */
			showMessage : function(message, elementId){
				if ( this.timeOut ) {
					clearTimeout( this.timeOut );
				}
				$(elementId)
					.empty()
					.append(message)
					.slideDown();
					
				// Hide status message after a given time
				this.timeOut = setTimeout( function() {
					$(elementId).slideUp();
				}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
			},
			
			/** update the list of selected data access statuses when a download manager has been selected. */
			updateView : function(){
				$("#darsDiv").empty();
				var darsContent = _.template(DAR_monitoring_template, this.orderedStatuses);
				$("#darsDiv").append(darsContent);
				this.$el.trigger('create');
				this.setUpStatusIcons();
			},
			
			/** Display the list of DMs assigned to Data Access Requests in the left side and the list of 
			 * Data access request in the right side.
			 * By default all the DARS are displayed.  */
			render : function() {

				var mainContent = _.template(accountDARs_template, this.model);
				this.$el.append(mainContent);
				var darsContent = _.template(DAR_monitoring_template, this.orderedStatuses);
				$("#darsDiv").append(darsContent);
				this.$el.trigger('create');			
				this.setUpStatusIcons();
				return this;
			},
			
			/** assign the correct status icon and update the buttons status for each data access request 
			 * depending on the DAR status. */
			setUpStatusIcons : function(){
				
				var validStatusesConfig = Configuration.localConfig.dataAccessRequestStatuses.validStatuses;
				var self = this;
				
				_.each(this.orderedStatuses.orderedStatusesToDisplay, function(orderedStatus){
					
					_.each(orderedStatus.DARs, function(darStatus, i){
					
						//select the DAR element
						var selector = "div[id='" + darStatus.ID + "']";
	//					console.log("selector");
	//					console.log(selector);	
						var darDiv = $("#darsDiv").find(selector);
						var collapsibleHeader = darDiv.find(".ui-btn-inner:eq(0)");	
						var pauseButton = darDiv.find("button[id='pause_" + darStatus.ID + "']");
						var stopButton = darDiv.find("button[id='stop_" + darStatus.ID + "']");
	//					console.log(collapsibleHeader);
	//					console.log($(collapsibleHeader).find(".ui-btn-inner"));
	
						  switch (darStatus.status){
	
						  	  //processing
							  case validStatusesConfig.inProgressStatus.value:
								  collapsibleHeader.append('<span class="ui-icon-processing ui-icon .ui-shadow">&nbsp;</span>');
								  break;
							
							  //paused 
							  case validStatusesConfig.pausedStatus.value:
								  collapsibleHeader.append('<span class="ui-icon-paused ui-icon .ui-shadow">&nbsp;</span>');
								  pauseButton.html("Resume"); 
								  //update the text in the span added by JQM to make the change effective
								  pauseButton.prev().find(".ui-btn-text").html("Resume"); 
								  break;
							
							  //completed
							  case validStatusesConfig.completedStatus.value: 
								  collapsibleHeader.append('<span class="ui-icon-completed ui-icon .ui-shadow">&nbsp;</span>');
								  pauseButton.button('disable');
								  stopButton.button('disable');
								  break; 
						   			
							  //Cancelled
							  case validStatusesConfig.cancelledStatus.value:
								  collapsibleHeader.append('<span class="ui-icon-cancelled ui-icon .ui-shadow">&nbsp;</span>');
								  pauseButton.button('disable');
								  stopButton.button('disable');
								  break;
							  
							  //Unknown Status
							  default :
								  collapsibleHeader.append('<span class="ui-icon-unknown ui-icon .ui-shadow">&nbsp;</span>');
							  	  pauseButton.button('disable');
							      stopButton.button('disable');
						  		  break;
						 }	

					});
				});

			}

	});

	return DataAccessRequestMonitoringView;

});