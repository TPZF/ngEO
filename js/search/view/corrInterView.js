

define( ['jquery', 'backbone', 'text!search/template/corrInterContent.html', 
         'jqm-datebox-calbox', 'ui/dateRangeSlider'], 
		function($, Backbone, corrInterContent_template) {

/**
 * The backbone model is DatasetSearch
 */
var CorrInterView = Backbone.View.extend({

	// Events
	events: {		
		"change #masterD": function(event) {
			this.model.setMaster( $(event.currentTarget).val() );
		},
		
		"blur input": function(event) {
			this.model.set( event.currentTarget.id, $(event.currentTarget).val() );
		}
	},
	
	// Render the corr/infer view
	render: function() {
		var content = _.template(corrInterContent_template, this.model, { variable: 'model' });
		this.$el.html(content);

		return this;
	}
		
});

return CorrInterView;

});