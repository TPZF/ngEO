
var Configuration = require('configuration');
var ShopcartCollection = require('shopcart/model/shopcartCollection');
var exportViewContent_template = require('shopcart/template/shopcartExportContent');

var ShopcartExportView = Backbone.View.extend({



	events: {

		'change #shopcart-export-format': function(event) {
			var $download = this.$el.find('#download-exported-shopcart');
			var $select = $(event.currentTarget);

			if ($select.val() == '') {
				$download.addClass('ui-disabled');
			} else {
				var format = $select.val();
				$download.removeClass('ui-disabled');
				var selectedShopcarts = ShopcartCollection.getSelected();
				if ( selectedShopcarts.length != 1 ) {
					console.warn('Invalid number of selected shopcarts', selectedShopcarts.length);
					// TODO: Handle this later..
				}
				$download.attr('href', selectedShopcarts[0].url() + "?format=" + format);
			}
		},

	},

	render: function() {
		this.$el.append(exportViewContent_template());
		this.$el.trigger('create');
		this.$el.find('#download-exported-shopcart').addClass('ui-disabled');

		return this;
	}

});

module.exports = ShopcartExportView;