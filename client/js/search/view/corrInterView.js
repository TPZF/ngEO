

define( ['jquery', 'backbone', 'text!search/template/corrInterContent.html', 
         'jqm-datebox', 'ui/dateRangeSlider'], 
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
		
		// Update model from sliders		
		"slidestop input": 'updateModel',
		// Update model from classic input on blur
		"blur input": 'updateModel'
	},

	// Update model properties from input
	updateModel: function(event) {
		var name = event.currentTarget.id;
		if ( name.match(/_from|_to/) ) {
			name = name.replace(/_from|_to/,'');
			this.updateRange(name);
		} else {
			this.model.set( name, $(event.currentTarget).val() );
		}
	},

	// Update range
	updateRange: function(name) {
		var $from = this.$el.find('#' + name + '_from');
		var $to = this.$el.find('#' + name + '_to');
		
		var value = [$from.val(), $to.val()];
		this.model.set(name, value);
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