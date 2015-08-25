define( ['jquery', 'backbone', 'configuration',
         'text!search/template/schedulingOptions_template.html', 
         "jqm-datebox"], 
		function($, Backbone, Configuration, schedulingOptions_template) {

	/**
	 * This view handles the displaying of standing orders request parameters.
	 * The attribute request is the request to be submitted.
	 */
	var SchedulingOptionsView = Backbone.View.extend({
	
		initialize : function(options){
			this.request = options.request;
			this.parentWidget = options.parentWidget;
		},
		
		events : {

			'change #startDateSTO' : function(event){
				var date = $(event.currentTarget).val();
				this.request.startDate = Date.fromISOString(date+"T00:00:00.000Z");
				// NGEO-1814: Change of scheduling options start date must not affect the opensearch request date
				//this.model.set({"start" : Date.fromISOString(date+"T00:00:00.000Z")});
			},
			
			'change #endDateSTO' : function(event){
				var date = $(event.currentTarget).val();
				this.request.endDate = Date.fromISOString(date+"T23:59:59.999Z");
				// NGEO-1814: Change of scheduling options end date must not affect the opensearch request date
				//this.model.set({"stop" : Date.fromISOString(date+"T23:59:59.999Z")});
			},

			// Choose STO type : Data-driven or Time-driven
			'change input[name="STOType"]' : function(event){
				
				// Update the visibility of time-driven-element
				var timeDrivenElt = this.$el.find("#timeDrivenParams");
				if (event.currentTarget.id == "time-driven-input") {
					// Set standing order request type
					this.request.timeDriven = true;
					timeDrivenElt.show();
				} else {//click on the Data-driven radio button
					this.request.timeDriven = false;
					timeDrivenElt.hide();
				}
			},
			
			// Set repeat period
			'change #repeatPeriodInput' : function(event){
				this.request.repeatPeriod = $(event.currentTarget).val();
			},
			
			// Set slide time
			'change input#applyShiftCheckBox' : function(event){
				this.request.slideAcquisitionTime = $(event.target).is(':checked');
			}
			
		},
		
		/**
		 * Render the view
		 */
		render: function(){
			// Get the default values from the model
			var content = _.template(schedulingOptions_template, this.request);
			this.$el.html(content);
			this.$el.find("#standingOrderSpecificMessage").append(this.request.getSpecificMessage());
			if (!this.request.timeDriven){
				this.$el.find("#timeDrivenParams").hide();
			}
			this.$el.trigger('create');
			return this;
		}
		
	});
	
	return SchedulingOptionsView;

});
