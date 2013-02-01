

define( ['jquery', 'backbone', 'map/map', "search/view/boxView", "search/view/polygonView", "search/view/gazetteerView", "search/view/importView",
         'text!search/template/areaCriteriaContent.html'], 
		function($, Backbone, Map, BoxView, PolygonView, GazetteerView, ImportView, areaCriteria_template) {

/**
 * The SpatialExtentView manages the different views to define the search area (or zone of interest).
 */
var SpatialExtentView = Backbone.View.extend({
	
	// Constructor
	initialize : function(options) {
	
		this.searchAreaLayer = null;
		this.mode = "bbox";
		
		// Listen when the searchArea has changed to update the view
		this.model.on("change:searchArea",  this.onModelChanged, this);		
	},
	
	// Events
	events :{
		'change #toolsChoice' : function(event) {
			var val = $(event.currentTarget).find('input:radio:checked').val();
			
			this.tools[this.mode].close();
			this.tools[val].open();
			
			this.mode = val;
		}
	},
	
	/**
	 * Update the search area layer
	 */
	updateSearchAreaLayer: function() {
		// Create the layer if not already done
		if ( !this.searchAreaLayer ) {
			// Create a layer for the search area
			this.searchAreaLayer = {
				name: "Search Area",
				type: "GeoJSON",
				visible: true,
				style: "search-area",
				data: this.model.searchArea.getFeature()
			};
			Map.addLayer( this.searchAreaLayer );
		} else {
			Map.updateFeature( this.searchAreaLayer, this.model.searchArea.getFeature()  );
		}
		
		// TODO maybe a 'smart' zoomTo is needed?
		//Map.zoomTo( this.model.searchArea.getFeature().bbox );
	},
	
	// Called when model has changed from outside the view, i.e. when a search URL is given by the user
	onModelChanged: function() {
		if ( this.model.searchArea.getMode() == 0 ) {
			this.tools['bbox'].updateFromModel();
			$('#radio-bbox-label').trigger('click'); 
		} else if ( this.model.searchArea.getMode() == 1 ) {
			this.tools['polygon'].updateFromModel();
			$('#radio-polygon-label').trigger('click'); 
		}
	},
		
	// Build the view
	render: function(){

		this.$el.append(_.template(areaCriteria_template, this.model));
		
		// Create the view for the different tools
		this.tools = {
			'bbox': new BoxView({
				model: this.model,
				parentView: this,
				el: $('#bbox').get(0)
			}),
			'polygon': new PolygonView({
				model: this.model,
				parentView: this,
				el: $('#polygon').get(0)
			}),
			'gazetteer': new GazetteerView({
				model: this.model,
				parentView: this,
				el: $('#gazetteer').get(0)
			}),
			'import': new ImportView({
				model: this.model,
				parentView: this,
				el: $('#import').get(0)
			})
		};
		
		// Close all the tools except the current one
		for ( var t in this.tools ) {
			if ( this.tools.hasOwnProperty(t) ) {
				if ( t != this.mode ) {
					this.tools[t].close();
				}
			}
		}
		
		// Open the current tools
		this.tools[this.mode].open();
		
		return this;
	},
	
});

return SpatialExtentView;

});