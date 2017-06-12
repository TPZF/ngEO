var Configuration = require('configuration');
var GeoJsonConverter = require('map/geojsonconverter');
var ShopcartCollection = require('shopcart/model/shopcartCollection');
var exportViewContent_template = require('shopcart/template/shopcartExportContent');

var ShopcartExportView = Backbone.View.extend({

	/**
	 * the model is featureCollection of the shopcart
	 */

	mediaTypes: {
		'kml': 'application/vnd.google-earth.kml+xml',
		'gml': 'application/gml+xml',
		'geojson': 'application/json',
		'metalink': 'application/metalink+xml'
	},

	events: {

		'change #shopcart-export-format': function(event) {
			var $download = this.$el.find('#download-exported-shopcart');
			var $select = $(event.currentTarget);

			if ($select.val() == '') {
				$download.addClass('ui-disabled');
			} else {
				var format = $select.val().toLowerCase();
				$download.removeClass('ui-disabled');

				// Export with original geometries, also remove other internal properties
				var featureWithOrigGeometries = $.extend(true, [], this.model.highlights);
				$.each(featureWithOrigGeometries, function(index, feature) {
					if (feature._origGeometry) {
						feature.geometry = feature._origGeometry;
						delete feature._origGeometry;
					}

					// Remove internal properties
					if (feature._featureCollection)
						delete feature._featureCollection;
					if (feature._isHidden)
						delete feature._isHidden;
					if (feature.properties.styleHint)
						delete feature.properties.styleHint;
				});

				var blob = new Blob([GeoJsonConverter.convert(featureWithOrigGeometries, format)], {
					"type": this.mediaTypes[format]
				});
				$download.attr('download', 'export.' + format);
				$download.attr('href', URL.createObjectURL(blob));
			}
		}
	},

	render: function() {

		// Check for blob support
		var blob = null;
		if (window.Blob) {
			// For Safari 5.1, test if we can create Blob.
			try {
				blob = new Blob();
			} catch (err) {
				blob = null;
			}
		}

		if (!blob) {
			this.$el.append('<p class="ui-error-message"><b>Export is not supported in your browser</b></p>');
		} else {
			this.$el.append(exportViewContent_template());
			this.$el.trigger('create');
			this.$el.find('#download-exported-shopcart').addClass('ui-disabled');
		}
		return this;
	}

});

module.exports = ShopcartExportView;