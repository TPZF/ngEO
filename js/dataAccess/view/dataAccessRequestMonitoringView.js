define(
		[ 'jquery', 'backbone', 'configuration', 'text!dataAccess/template/accountDARsContent.html',
		  'text!dataAccess/template/dataAccessRequestMonitoringContent.html'],
	
	function($, Backbone, Configuration, accountDARs_template, DAR_monitoring_template) {
		
		var DataAccessRequestMonitoringView = Backbone.View.extend({

			events : {
				'click button' : function(event){
					var buttonId = event.currentTarget.id;
					console.log($('#'+ event.currentTarget.id));
					var darId = buttonId.substring(buttonId.indexOf('_')+1, buttonId.length);
					console.log(darId);
					
					var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
					if (buttonId.indexOf('stop') == 0){
						this.model.requestChangeStatus(darId, validStatusesConfig.cancelledStatus.value);
					}else if (buttonId.indexOf('pause') == 0){
						this.model.requestChangeStatus(darId, validStatusesConfig.pausedStatus.value);
					}else{
						//not supported case
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
			render : function() {

				var mainContent = _.template(accountDARs_template, this.model);
				this.$el.append(mainContent);
				var darsContent = _.template(DAR_monitoring_template, this.model);
				$("#darsDiv").append(darsContent);
				this.$el.trigger('create');
			
				var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
				var self = this;
				
				_.each(this.model.get("dataAccessRequestStatuses"), function(darStatus, i){
					
					var selector = "div[id='" + darStatus.ID + "']";
//					console.log("selector");
//					console.log(selector);				
					var collapsibleHeader = $("#darsDiv").find(selector).find(".ui-btn-inner:eq(0)");														
//					console.log(collapsibleHeader);
//					console.log($(collapsibleHeader).find(".ui-btn-inner"));

					  switch (darStatus.status){

					  	  //processing
						  case validStatusesConfig.inProgressStatus.value:
							  collapsibleHeader.append('<span class="ui-icon-processing ui-icon">&nbsp;</span>');
							  break;
						
						  //paused 
						  case validStatusesConfig.pausedStatus.value:
							  collapsibleHeader.append('<span class="ui-icon-paused ui-icon">&nbsp;</span>');
							  break;
						
						  //completed
						  case validStatusesConfig.completedStatus.value: 
							  collapsibleHeader.append('<span class="ui-icon-completed ui-icon">&nbsp;</span>');
							  break; 
					   			
						  //Cancelled
						  case validStatusesConfig.cancelledStatus.value:
							  collapsibleHeader.append('<span class="ui-icon-cancelled ui-icon">&nbsp;</span>');
							  break;
						  
						  //Unknown Status
						  default :
							  collapsibleHeader.append('<span class="ui-icon-unknown ui-icon">&nbsp;</span>');
					  		  break;
					 }	

				});
				
				this.$el.trigger('create');
				
				return this;
			}

	});

	return DataAccessRequestMonitoringView;

});