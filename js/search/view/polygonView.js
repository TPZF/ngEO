

define( ['jquery', 'backbone', 'map/map', 'map/polygonHandler'], 
		function($, Backbone, Map, PolygonHandler) {

/**
 * The PolygonView manages the view to define the search area as a polygon.
 * Embedded in the SpatialExtentView.
 */
var PolygonView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options) {
		this.searchArea = options.searchArea;
		this.parentView = options.parentView;
	},
	
	events :{
				
		'click #drawpolygon': function(event) {
			var self = this;
			PolygonHandler.start({
				layer: this.parentView.searchAreaLayer,
				feature: this.model.searchArea.getFeature(),
				stop: function() {
					$('#polygontext').val( self.model.searchArea.getPolygonText() ).keyup();
				}
			});
		},
				
		'change #polygontext': function(event) {
			if (!this.model.searchArea.setPolygonFromText( $(event.currentTarget).val() )) {
				// Erase content
				$(event.currentTarget).val('');
				// TODO : display a message to user
			}
			this.parentView.updateSearchAreaLayer();
		},
			
	},
	
	// Update from the model
	updateFromModel: function() {
		$('#polygontext').val( this.model.searchArea.getPolygonText() ).keyup();
	},
	
	// Open the view : show it and update the model
	open: function() {
		var text = this.$el.find('#polygontext').val();
		this.model.searchArea.setPolygonFromText( text );
		this.parentView.updateSearchAreaLayer();
		this.$el.show();
	},
	
	// Close the view : hide it
	close: function() {
		this.$el.hide();
	},	
		
});

return PolygonView;

});