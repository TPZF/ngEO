

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults', 'map/geojsonConverter',
          'text!searchResults/template/exportViewContent.html'], 
		function($, Backbone, Configuration, SearchResults, GeoJsonConverter, exportViewContent) {

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
				var blob = new Blob( [ GeoJsonConverter.convert(SearchResults.selection, format) ], { "type" : this.mediaTypes[format] });
				$download.attr('download', 'export.' + format);
				$download.attr('href', URL.createObjectURL(blob) );
			}		
		},
		
	},
		
	render: function(){

		this.$el.append(exportViewContent);
		this.$el.trigger('create');
		this.$el.find('#download').addClass('ui-disabled');
		return this;
	}

});

return ExportView;

});
