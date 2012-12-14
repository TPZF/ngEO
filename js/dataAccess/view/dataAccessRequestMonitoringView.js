define(
		[ 'jquery', 'backbone', 'configuration', 'text!dataAccess/template/accountDARsContent.html',
		  'text!dataAccess/template/dataAccessRequestMonitoringContent.html'],
	
	function($, Backbone, Configuration, accountDARs_template, DAR_monitoring_template) {
		
		var DataAccessRequestMonitoringView = Backbone.View.extend({

			initialize : function(){
				this.model.on("DARStatusChanged" , this.updateDARStatusView, this);
			},
			
			events : {
				'click button' : function(event){
					var buttonId = event.currentTarget.id;
					console.log($('#'+ event.currentTarget.id));
					//the stop and pause buttons ids follow expressions stop_id and pause_id 
					//where is is the related dar id
					var darId = buttonId.substring(buttonId.indexOf('_')+1, buttonId.length);
					console.log(darId);
					
					var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
					
					if (buttonId.indexOf('stop') == 0){//stop button is clicked
						this.model.requestChangeStatus(darId, validStatusesConfig.cancelledStatus.value);
					
					}else if (buttonId.indexOf('pause') == 0){//pause button triggered to pause and resume actions
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
//					console.log($('#'+ event.currentTarget.id));
//					var target = $('#'+ event.currentTarget.id);
//					if ( target.hasClass('ui-btn-active') ) {
//						target.removeClass('ui-btn-active');
//						this.selectedDownloadManagertId = undefined;
//						
//				    } else {
//					   this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
//					  target.addClass('ui-btn-active');
//					  this.selectedDatasetId = event.currentTarget.id;
//				    }
				
				}
			},
			
			/** change the "Pause" button text to be Resume
			 * update the button text in the jqm span for button text to make the
			 * button text updated*/
			updateDARStatusView : function(args){

				var darId = args[1];
				var messageEltId  = "#serverDARMonitoringResponse_" + darId;
				$(messageEltId).empty().append(args[3]);
				
				if (args[0] == 'SUCCESS'){
					
					var selector = "div[id='" + darId + "']";
//					console.log("selector");
//					console.log(selector);	
					var darDiv = $("#darsDiv").find(selector);
					var collapsibleHeader = darDiv.find(".ui-btn-inner:eq(0)");	
					var pauseButton = darDiv.find("button[id='pause_" + darId + "']");
					var stopButton = darDiv.find("button[id='stop_" + darId + "']");
					var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
					
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
							//definitevely and the old status was processing or paused
							
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
		
			render : function() {

				var mainContent = _.template(accountDARs_template, this.model);
				this.$el.append(mainContent);
				var darsContent = _.template(DAR_monitoring_template, this.model);
				$("#darsDiv").append(darsContent);
				this.$el.trigger('create');
			
				var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
				var self = this;
				
				_.each(this.model.get("dataAccessRequestStatuses"), function(darStatus, i){
					
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
				
				this.$el.trigger('create');
				
				return this;
			}

	});

	return DataAccessRequestMonitoringView;

});