

define( ['jquery', 'backbone', 'map/map', 'map/rectangleHandler'], 
		function($, Backbone, Map, RectangleHandler) {

/**
 * The BoxView manages the view to define the search area as a box.
 * Embedded in the SpatialExtentView.
 */
var BoxView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options) {
		this.parentView = options.parentView;
		
		// Listen when useExtent is changed to update the view
		this.model.on("change:useExtent",  function() {
			var $cb = this.$el.find('#mapExtentCheckBoxLabel');
			var useExtent = $cb.hasClass('ui-checkbox-on');
			if ( useExtent != this.model.get('useExtent') ) {
				$cb.trigger('click');
			}
		}, this);
	},
	
	events :{		
		'click #drawbbox': function(event) {
			$('#datasetSearchCriteria').ngeowidget('hide');
			this.model.set('useExtent',false);
			var self = this;
			RectangleHandler.start({
				layer: this.parentView.searchAreaLayer,
				stop: function() {
					$('#datasetSearchCriteria').ngeowidget('show');
					var bbox = self.model.searchArea.getBBox();
					$("#west").val( bbox.west );
					$("#south").val( bbox.south );
					$("#east").val( bbox.east );
					$("#north").val( bbox.north );
				}
			});
		},
				
		//blur insure that values has been manually changed by the user
		'blur #bbox input' : function(event){
			this.model.searchArea.setBBox({
				west : $("#west").val(),
				south: $("#south").val(),
				east: $("#east").val(),
				north: $("#north").val()
			});
			this.parentView.updateSearchAreaLayer();

		},
			
		'click #mapExtentCheckBoxLabel' : function(event){
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({"useExtent" : useExtent}, { silent: true });
			if ( useExtent ) {
				this.synchronizeWithMapExtent();
				Map.on("endNavigation", this.synchronizeWithMapExtent, this);
				if (this.parentView.searchAreaLayer) {
					Map.removeLayer(this.parentView.searchAreaLayer);
				}
			} else {
				Map.off("endNavigation", this.synchronizeWithMapExtent, this);
				if (this.parentView.searchAreaLayer) {
					Map.addLayer(this.parentView.searchAreaLayer);
				}
				this.parentView.updateSearchAreaLayer();
			}
		},

		
	},
	
	// Update from the model
	updateFromModel: function() {
		var bbox = this.model.searchArea.getBBox();
		$("#west").val( bbox.west );
		$("#south").val( bbox.south );
		$("#east").val( bbox.east );
		$("#north").val( bbox.north );
	},
	
	// Change the use extent
	onUseExtentChanged: function() {
		var $cb = this.$el.find('#mapExtentCheckBoxLabel');
		var useExtent = $cb.hasClass('ui-checkbox-on');
		if ( useExtent != this.model.get('useExtent') ) {
			$cb.trigger('click');
		}
	},
	
	// Open the view
	open: function() {
		if (this.model.get("useExtent")) {
			Map.on("endNavigation", this.synchronizeWithMapExtent, this);
			this.synchronizeWithMapExtent();
			// Remove the search area layer when using extent
			if (this.parentView.searchAreaLayer) {
				Map.removeLayer(this.parentView.searchAreaLayer);
			}
		} else {
			this.model.searchArea.setBBox({
				west : $("#west").val(),
				south: $("#south").val(),
				east: $("#east").val(),
				north: $("#north").val()
			});
			this.parentView.updateSearchAreaLayer();
		}
		this.$el.show();
	},
	
	// Close the view
	close: function() {
		// Stop listening to map extent
		if ( this.model.get("useExtent") ) {
			Map.off("endNavigation", this.synchronizeWithMapExtent, this);
			if (this.parentView.searchAreaLayer) {
				Map.addLayer(this.parentView.searchAreaLayer);
			}
		}
		this.$el.hide();
	},
		
	// Synchronize map extent
    synchronizeWithMapExtent : function(){
    	var mapExtent = Map.getViewportExtent();
		this.model.searchArea.setBBox({west : mapExtent[0],
			south : mapExtent[1],
			east : mapExtent[2],
			north : mapExtent[3]
		});
		
		$("#west").val(mapExtent[0]);
		$("#south").val(mapExtent[1]);
		$("#east").val(mapExtent[2]);
		$("#north").val(mapExtent[3]);
    }
	
});

return BoxView;

});