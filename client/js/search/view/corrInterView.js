//require('jqm-datebox');
//require('ui/dateRangeSlider');
var corrInterContent_template = require('search/template/corrInterContent');

/**
 * The backbone model is DatasetSearch
 */
var CorrInterView = Backbone.View.extend({

	// Events
	events: {
		"change #masterD": function(event) {
			this.model.setMaster($(event.currentTarget).val());
		},

		// Update model from sliders		
		"slidestop input": 'updateModel',
		// Update model from classic input on blur
		"blur input": 'updateModel'
	},

	// Update model properties from input
	updateModel: function(event) {
		var name = event.currentTarget.id;
		if (name.match(/_from|_to/)) {
			name = name.replace(/_from|_to/, '');
			this.updateRange(name);
		} else {
			this.model.set(name, $(event.currentTarget).val());
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
		var content = corrInterContent_template({
			model: this.model
		});
		this.$el.html(content);

		return this;
	}

});

module.exports = CorrInterView;