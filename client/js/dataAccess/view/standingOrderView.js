define( ['jquery', 'backbone', 'configuration',
         'text!dataAccess/template/standingOrderViewContent.html', 
         "jqm-datebox-calbox", "jqm-datebox-datebox"], 
		function($, Backbone, Configuration, standingOrderView_template) {

	/**
	 * This view handles the displaying of standing orders request parameters.
	 * 
	 * The attribute request is the request to be submitted.
	 * 
	 */
	var StandingOrderView = Backbone.View.extend({
	
		initialize : function(options){
			this.request = options.request;
			this.parentWidget = options.parentWidget;
		},
		
		events : {
			
			'change #startDateSTO' : function(event){
				this.request.startDate = $(event.currentTarget).val();
			},
			
			'change #endDateSTO' : function(event){
				this.request.endDate = $(event.currentTarget).val();
			},		
			
			//choose STO type : Data-driven or Time-driven
			'click #type label' : function(event){
				
				//the ui-radio-on state will be set at the end of the handler
				//that's why make the test according to ui-radio-off
				var isChecked = ($(event.currentTarget).hasClass('ui-radio-off'));
			
				//case where the user clicks on the already selected radio
				if (isChecked == false){
					return;
				}
				
				var timeDrivenElt = $("#timeDrivenParams");
				
				if (event.currentTarget.id == "time-driven-label"){
					
					//Set standing order request type
					this.request.timeDriven = isChecked;
					
					//update the time driven parameters display
					if (isChecked){
						timeDrivenElt.show();
					}else{
						timeDrivenElt.hide();
					}
				}else{//click on the Data-driven radio button
					
					
					//Set standing order request type
					this.request.timeDriven = !isChecked;
					
					//update the time driven parameters display
					if (isChecked){
						timeDrivenElt.hide();
					}else{
						timeDrivenElt.show();
					}
				}
			},
			
			//set repeat period
			'change #repeatPeriodInput' : function(event){
				this.request.repeatPeriod = $(event.currentTarget).val();
			},
			
			//set slide time
			'click #applyShitfLabel' : function(event){
				
				var isChecked = !($(event.currentTarget).hasClass('ui-checkbox-off'));
				this.request.slideAcquisitionTime = !isChecked;
			},
			
			//trigger the assignment to the STO request to a download manager
			'click #CreateSTORequest' : function(event){
				
				var self = this;	
				this.parentWidget.displayDownloadManagersView();
			}
		},
		
		render: function(){
			var content = _.template(standingOrderView_template, {startDate : this.request.startDate, 
																	startTime : this.request.startTime, 
																	endDate : this.request.endDate,
																	endTime : this.request.endTime});
			this.$el.append(content);
			this.$el.find("#standingOrderSpecificMessage").append(this.request.getSpecificMessage());
			this.$el.find("#timeDrivenParams").hide();
			this.delegateEvents();

			return this;
		}
		
	});
	
	return StandingOrderView;

});
