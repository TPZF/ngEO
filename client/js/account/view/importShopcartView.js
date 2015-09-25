var Logger = require('logger');

var importShopcartView = Backbone.View.extend({

	events: {
		//TO BE IMPLEMENTED once the format is defined
	},

	// Render the view
	render: function() {

		this.$el.append('<div id="shopcartImportDiv"><div id="shopcartDropZone">\b Drop a Shopcart File Here (KML, GeoJSON or GML) \b</div><p id="shopcartImportMessage"></p></div>');
		this.$el.trigger('create');

		return this;
	}
});

module.exports = importShopcartView;