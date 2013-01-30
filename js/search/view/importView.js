

define( ['jquery', 'backbone', 'map/layerImport'], 
		function($, Backbone, LayerImport) {

/**
 * The ImportView manages the view to define the search area using an imported layer.
 * Embedded in the SpatialExtentView.
 */
var ImportView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options) {
		this.importedLayer = null;
		this.parentView = options.parentView;
		
		// Setup the drop area for import
		LayerImport.addDropArea( this.$el.find('#dropZone').get(0), $.proxy(this.onFileLoaded,this) );
	},
	
	events :{
		
	},
	
	open: function() {
		// Restore the imported layer as search area
		if ( this.importedLayer ) {
			this.model.searchArea.setFromLayer(this.importedLayer);
		} else {
			this.model.searchArea.empty();
		}
		// Update the search area
		this.parentView.updateSearchAreaLayer();
		this.$el.show();
	},
	
	close: function() {
		this.$el.hide();
	},	

	
	// Callback called when a file is loaded
	onFileLoaded: function(layer,file) {
		this.importedLayer = layer;
		var res = this.model.searchArea.setFromLayer(layer);
		if (!res.valid) {
			$('#importMessage').html('Failed to import ' + file.name + ' : ' + res.message + '.' );
		} else {
			$('#importMessage').html("File sucessfully imported : " + file.name);
			this.parentView.updateSearchAreaLayer();
		}		
	},
	
});

return ImportView;

});