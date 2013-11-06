define( ['jquery', 'backbone', 'configuration',
         'text!search/template/schedulingOptions_template.html', 
         "jqm-datebox-calbox"], 
		function($, Backbone, Configuration, schedulingOptions_template) {

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
				var date = $(event.currentTarget).val();
				this.request.startDate = date;
				this.model.set({"start" : Date.fromISOString(date+"T00:00:00.000Z")});
			},
			
			'change #endDateSTO' : function(event){
				var date = $(event.currentTarget).val();
				this.request.endDate = date;
				this.model.set({"stop" : Date.fromISOString(date+"T23:59:59.999Z")});
			},

			//choose STO type : Data-driven or Time-driven
			'click #type label' : function(event){
				
				//the ui-radio-on state will be set at the end of the handler
				//that's why make the test according to ui-radio-off
				var isChecked = $(event.currentTarget).hasClass('ui-radio-off');
			
				//case where the user clicks on the already selected radio
				if (isChecked == false){
					return;
				}
				
				var timeDrivenElt = this.$el.find("#timeDrivenParams");
				
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
			}
			
		},
		
		/**
		 * Render the view
		 */
		render: function(){
			//get the default values from the model
			var content = _.template(schedulingOptions_template, this.request);
			this.$el.append(content);
			this.$el.find("#standingOrderSpecificMessage").append(this.request.getSpecificMessage());
			if (!this.request.timeDriven){
				this.$el.find("#timeDrivenParams").hide();
			}
			this.$el.trigger('create');
			return this;
		}
		
	});
	
	return StandingOrderView;

});
