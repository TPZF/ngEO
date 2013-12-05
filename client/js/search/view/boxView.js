

define( ['jquery', 'backbone', 'map/map', 'map/rectangleHandler'], 
		function($, Backbone, Map, RectangleHandler) {

function isValidLon(lon) {
	if (isNaN(lon))
		return false;
	
	return lon > -180 && lon < 180;
}
function isValidLat(lat) {
	if (isNaN(lat))
		return false;
	
	return lat > -90 && lat < 90;
}

function clipLon(lon) {
	while (lon > 180)
		lon -= 360;
	while (lon < -180)
		lon += 360;
	return lon;
}
function clipLat(lat) {
	while (lat > 90)
		lat -= 180;
	while (lat < -90)
		lat += 180;
	return lat;
}

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
			this.model.set('useExtent',false);
			var self = this;
			RectangleHandler.start({
				layer: this.parentView.searchAreaLayer,
				feature: this.model.searchArea.getFeature(),
				stop: function() {
					var bbox = self.model.searchArea.getBBox();
					$("#west").val( bbox.west );
					$("#south").val( bbox.south );
					$("#east").val( bbox.east );
					$("#north").val( bbox.north );
				}
			});
		},
				
		//blur insure that values has been manually changed by the user
		//change the bbox in the model only and inly if it is valid
		'blur input' : function(event){
			
			var bbox = {
					west : parseFloat($("#west").val()),
					south: parseFloat($("#south").val()),
					east: parseFloat($("#east").val()),
					north: parseFloat($("#north").val())
				};
				
			
			if (isValidLon(bbox.west) && isValidLon(bbox.east) &&
				isValidLat(bbox.south) && isValidLat(bbox.north) ) {
				this.model.searchArea.setBBox(bbox);
			} else {
				bbox = this.model.searchArea.getBBox();
				$("#west").val( bbox.west );
				$("#south").val( bbox.south );
				$("#east").val( bbox.east );
				$("#north").val( bbox.north );
			}
			
			this.parentView.updateSearchAreaLayer();

		},
			
		'click #mapExtentCheckBoxLabel' : function(event){
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({"useExtent" : useExtent}, { silent: true });
			if ( useExtent ) {
				this.activateUseExtent();
			} else {
				this.deactivateUseExtent();
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
	
	activateUseExtent: function() {
		Map.on("extent:change", this.synchronizeWithMapExtent, this);
		this.synchronizeWithMapExtent();
		// Remove the search area layer when using extent
		if (this.parentView.searchAreaLayer) {
			Map.removeLayer(this.parentView.searchAreaLayer);
		}
		this.$el.find("input").addClass( "ui-disabled" );
	},
	
	deactivateUseExtent: function() {
		Map.off("extent:change", this.synchronizeWithMapExtent, this);
		if (this.parentView.searchAreaLayer) {
			this.parentView.searchAreaLayer = Map.addLayer(this.parentView.searchAreaLayer.params);
		}
		this.parentView.updateSearchAreaLayer();
		this.$el.find("input").removeClass( "ui-disabled" );
	},

	// Open the view
	open: function() {
		if (this.model.get("useExtent")) {
			this.activateUseExtent();
		} else {
	
			var bbox = {
				west : parseFloat($("#west").val()),
				south: parseFloat($("#south").val()),
				east: parseFloat($("#east").val()),
				north: parseFloat($("#north").val())
			};
			this.model.searchArea.setBBox(bbox);
			this.parentView.updateSearchAreaLayer();
		}
		this.$el.show();
	},
	
	// Close the view
	close: function() {
		// Stop listening to map extent
		if ( this.model.get("useExtent") ) {
			this.deactivateUseExtent();
		}
		this.$el.hide();
	},
		
	// Synchronize map extent
    synchronizeWithMapExtent : function(){
    	var mapExtent = Map.getViewportExtent();
		
		var bbox = { west : clipLon(mapExtent[0]),
			south : clipLat(mapExtent[1]),
			east : clipLon(mapExtent[2]),
			north : clipLat(mapExtent[3])
		};
		this.model.searchArea.setBBox(bbox);
		
		$("#west").val(bbox.west);
		$("#south").val(bbox.south);
		$("#east").val(bbox.east);
		$("#north").val(bbox.north);
    }
	
});

return BoxView;

});