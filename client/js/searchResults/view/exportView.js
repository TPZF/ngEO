

define( ['jquery', 'backbone', 'configuration', 'map/geojsonconverter',
          'text!searchResults/template/exportViewContent.html'], 
		function($, Backbone, Configuration, GeoJsonConverter, exportViewContent) {

	/** TODO TO BE IMPLEMENTED */ 
var ExportView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 */
	 
	 mediaTypes : {
		'kml': 'application/vnd.google-earth.kml+xml',
		'gml': 'application/gml+xml',
		'geojson': 'application/json'
	 },
	
	events : {
		
		'change #export-format' : function(event){
			var $download = this.$el.find('#download');
			var $select = $(event.currentTarget);
			
			if ( $select.val() == '' ) {
				$download.addClass('ui-disabled');
			} else {
				var format = $select.val().toLowerCase(); 
				$download.removeClass('ui-disabled');
				var blob = new Blob( [ GeoJsonConverter.convert(this.model.selection, format) ], { "type" : this.mediaTypes[format] });
				$download.attr('download', 'export.' + format);
				$download.attr('href', URL.createObjectURL(blob) );
			}		
		},
		
	},
		
	render: function(){
	
		// Check for blob support
		var blob = null;
		if (window.Blob) {
			// For Safari 5.1, test if we can create Blob.
			try {
				blob = new Blob();
			} catch(err) {
				blob = null;
			}
		}
		
		if (!blob) {
			this.$el.append('<p class="ui-error-message"><b>Export is not supported in your browser</b></p>');
		} else {
			this.$el.append(exportViewContent);
			this.$el.trigger('create');
			this.$el.find('#download').addClass('ui-disabled');
		}
		return this;
	}

});

return ExportView;

});
