

define( ['jquery', 'backbone', 'text!search/template/dateCriteriaContent.html', 
         'jqm-datebox-calbox', 'jqm-datebox-datebox'], 
		function($, Backbone , dateCriteria_template, advancedCriteria_template) {

	/**
	 * The backbone model is DatasetSearch
	 */
var TimeExtentView = Backbone.View.extend({

	initialize : function(options){
		// Refresh the time extent when the dataset is changed
		this.model.on("change:datasetId", this.update, this);
	},
	
	events :{

		'change #fromDateInput' : function(event){
			this.model.set({"startdate" : $(event.currentTarget).val()});
		},
		'change #toDateInput' : function(event){
			this.model.set({"stopdate" : $(event.currentTarget).val()});
		},
		
		'change #fromTimeInput' : function(event){
			this.model.set({"startTime" : $(event.currentTarget).val()});
		},
		'change #toTimeInput' : function(event){
			this.model.set({"stopTime" : $(event.currentTarget).val()});
		}		
	},
	
	update: function() {
		$('#fromDateInput').val( this.model.get("startdate") );
		$('#toDateInput').val( this.model.get("stopdate") );
		$('#fromTimeInput').val( this.model.get("startTime") );
		$('#toTimeInput').val( this.model.get("stopTime") );
	},
	
	render: function(){
		var content = _.template(dateCriteria_template, this.model);
		this.$el.append($(content));
		return this;
	}
		
});

return TimeExtentView;

});