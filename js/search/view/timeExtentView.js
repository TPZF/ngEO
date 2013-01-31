

define( ['jquery', 'backbone', 'text!search/template/dateCriteriaContent.html', 
         'jqm-datebox-calbox', 'jqm-datebox-datebox'], 
		function($, Backbone , dateCriteria_template, advancedCriteria_template) {

	/**
	 * The backbone model is DatasetSearch
	 */
var TimeExtentView = Backbone.View.extend({

	initialize : function(options){
		// Refresh the dates and time slider checkbox when the values has been changed on the model 
		//typically for shared parameters urls
		this.model.on("change:startdate", this.update, this);
		this.model.on("change:stopdate", this.update, this);
		this.searchCriteriaView = options.searchCriteriaView;
		//this.model.on("change:useTimeSlider", function(){this.$el.find("input[type='checkbox']").prop("checked", this.model.get("useTimeSlider"));}, this);
	},
	
	events :{
		//The 2 next handlers listen to start and stop date changes
		'change #fromDateInput' : function(event){
			this.model.set({"startdate" : $(event.currentTarget).val()});
		},
		'change #toDateInput' : function(event){
			this.model.set({"stopdate" : $(event.currentTarget).val()});
		},
		//the 2 following handlers deal with time setting: COMMENTED FOR THE MOMENT
		'change #fromTimeInput' : function(event){
			this.model.set({"startTime" : $(event.currentTarget).val()});
		},
		'change #toTimeInput' : function(event){
			this.model.set({"stopTime" : $(event.currentTarget).val()});
		},
		//check box changes to display or not the time slider widget
		'click #useTimeSliderLabel' : function(event){
			var $target = $(event.currentTarget);	
			var checked = $target.hasClass('ui-checkbox-off');
			//hide the search criteria widget when the time slider is enabled
			//this is to keep the map visible 
			if (checked){
				//set the start date to the time slider start date 
//				var dateString = this.model.setStartDate(this.model.getSliderStartDate());
//				$("#fromDateInput").val(dateString);
//				$("#fromDateInput").trigger('datebox', {'method':'set', 'value': dateString});
				//disable the dates start and stop widgets if the time slider is enabled
				$("#fromDateInput").datebox("disable");
				$("#toDateInput").datebox("disable");
				//disable the submit search button
				this.searchCriteriaView.searchButton.button('disable');
				this.searchCriteriaView.$el.ngeowidget('hide');
			}else{
				//enable the dates start and stop widgets if the time slider is disabled
				$("#fromDateInput").datebox("enable");
				$("#toDateInput").datebox("enable");
				this.searchCriteriaView.searchButton.button('enable');
			}
			this.model.set({"useTimeSlider" : checked});
		}
		
	},
	
	update: function() {
		$('#fromDateInput').val( this.model.get("startdate") );
		$('#toDateInput').val( this.model.get("stopdate") );
		//Uncomment to use back times
//		$('#fromTimeInput').val( this.model.get("startTime") );
//		$('#toTimeInput').val( this.model.get("stopTime") );
	},
	
	render: function(){
		var content = _.template(dateCriteria_template, this.model);
		this.$el.append($(content));
		return this;
	}
		
});

return TimeExtentView;

});