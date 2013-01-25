

define( ['jquery', 'backbone', 'map/map', 'map/layerImport', 'map/geojsonconverter', 'map/gazetteer',
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Map, LayerImport, GeoJSONConverter, Gazetteer, areaCriteria_template) {

var SpatialExtentView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options){
		
		this.importedPolygon = null;
		this.importedLayer = null;
		this.mode = "bbox";
		//update the coordinates when the model has been changed via setting the parameters : Share URL case
		this.model.on("change:west", function(){$("#west").val(this.model.get("west"));}, this);
		this.model.on("change:south", function(){$("#south").val(this.model.get("south"));}, this);
		this.model.on("change:east", function(){$("#east").val(this.model.get("east"));}, this);
		this.model.on("change:north", function(){$("#north").val(this.model.get("north"));}, this);
		this.model.on("change:useExtent", function(){this.$el.find("input[type='checkbox']").prop("checked", this.model.get("useExtent"))}, this);
	},
	
	events :{
		'change #toolsChoice' : function(event) {
			var val = $(event.currentTarget).find('input:radio:checked').val();
			
			// Hide the previous tools
			this.$selectedTool.hide();
			
			// Show the new one
			this.$selectedTool = $('#' + val);
			this.$selectedTool.show();
			
			// And update datasetsearch
			this.updateModel(this.mode,val);
			this.mode = val;
		},
		
		//blur insure that values has been manually changed by the user
		'blur #west' : function(event){
			this.model.set({"west" : $(event.currentTarget).val()});
		},
		
		'blur #south' : function(event){
			this.model.set({"south" : $(event.currentTarget).val()});
		},
		
		'blur #east' : function(event){
			this.model.set({"east" : $(event.currentTarget).val()});
		},
		
		'blur #north' : function(event){
			this.model.set({"north": $(event.currentTarget).val()});
		},
		
		'click #mapExtentCheckBoxLabel' : function(event){
			
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({"useExtent" : useExtent});
			if ( useExtent ) {
				this.synchronizeWithMapExtent();
				Map.on("endNavigation", this.synchronizeWithMapExtent, this);
			} else {
				Map.off("endNavigation", this.synchronizeWithMapExtent, this);
			}
		},

		'click #gazetteer-results li' : function(event){		
			var $target = $(event.currentTarget);			
			if ( !$target.hasClass('ui-btn-active') ) {
				this.selectGazetteerResult( $target );
			}
		},
		
		'change #search-gazetteer': function(event) {
			$('#gazetteer-results').empty();
			var queryTerm = $(event.currentTarget).val();
			if ( queryTerm != "" ) {
				$('#search-gazetteer').textinput('disable');
				var self = this;
				Gazetteer.query({
						query: queryTerm,
						result: function(data) {
							$('#search-gazetteer').textinput('enable');
							
							// Build a list view for the results
							var listView = $('<ul data-inset="true"></ul>');
							for ( var i = 0; i < data.length; i++ ) {
								var fullName = data[i].display_name + ' (' + data[i].class + ' ' + data[i].type + ')';
								$('<li>' + fullName + '</li>')
									// Store the data into the DOM element
									.data('data',data[i])
									.appendTo(listView);
							}
							listView
								.appendTo('#gazetteer-results')
								.listview();

							self.selectGazetteerResult( $('#gazetteer-results').find('li:first') );
						}
					});
			}
		}
		
	},
	
	/**
	 * Select a gazetteer result given by its DOM element
	 * Update the model with bounding box of the gazetteer result and zoom on it.
	 */
	selectGazetteerResult: function($item) {
		$item.parent().find('.ui-btn-active').removeClass('ui-btn-active');
		$item.addClass('ui-btn-active');
		var data = $item.data('data');
			
		var south = parseFloat(data.boundingbox[0]);
		var north = parseFloat(data.boundingbox[1]); 
		var west = parseFloat(data.boundingbox[2]);
		var east = parseFloat(data.boundingbox[3]);
		Map.zoomTo( [ west, south, east,  north ] );
		
		this.model.set({
			west : west,
			south: south,
			east: east,
			north: north
		});
	},
	
	/**
	 * Update the model after the mode have been changed
	 * TODO : improve design
	 */
	updateModel: function(prevMode,newMode) {
	
		// Clean-up previous mode
		switch (prevMode) {
			case "import":
				if ( this.importedLayer ) {
					Map.removeLayer(this.importedLayer);
				}
				break;
			case "bbox":
				if ( this.model.get("useExtent") ) {
					Map.off("endNavigation", this.synchronizeWithMapExtent, this);
				}
				break;
		}
		
		// Reset the model
		this.model.set({
			west : "",
			south: "",
			east: "",
			north: "",
			polygon: null
		}, {
			silent: true
		});
		
		// Setup new mode
		switch (newMode) {
			case "bbox": 
				if (this.model.get("useExtent")) {
					Map.on("endNavigation", this.synchronizeWithMapExtent, this);
					this.synchronizeWithMapExtent();
				} else {
					this.model.set({
						west : $("#west").val(),
						south: $("#south").val(),
						east: $("#east").val(),
						north: $("#north").val()
					}, {
						silent: true
					});
				}
				break;
			
			case "import":
				if ( this.importedLayer ) {
					Map.addLayer(this.importedLayer);
					this.model.set("polygon", this.importedPolygon);
				}
				break;
				
			case "gazetteer":
				var $item = $('#gazetteer-results').find('li.ui-btn-active');
				if ( $item.length > 0 ) {
					this.selectGazetteerResult($item);
				}
				break;
		}
	},
	
	// Build the view
	render: function(){

		this.$el.append(_.template(areaCriteria_template, this.model));
		
		// Set the default selected tool between bbox, polygon, gazetteer, import
		this.$el.find('#gazetteer').hide();
		this.$el.find('#import').hide();
		this.$selectedTool = this.$el.find('#bbox');
				
		// Setup the drop are for import
		LayerImport.addDropArea( $('#dropZone').get(0), $.proxy(this.onFileLoaded,this) );
		
		// Synchronize with map extent if requested
		if ( this.model.get("useExtent") ) {
			this.synchronizeWithMapExtent();
			Map.on("endNavigation", this.synchronizeWithMapExtent, this);
		}
		return this;
	},
	
	// Get the imported feature from a layer
	getImportedFeature: function(layer) {
	
		// First convert the layer to GeoJSON
		if ( !GeoJSONConverter.convert(layer) ) {
			return { valid: false, message: 'format not supported' };
		}
		
		var feature;
		// Then check if the data is a feature collection or not
		if ( layer.data.type == 'FeatureCollection' ) {
			if ( layer.data.features.length == 1 ) {
				feature = layer.data.features[0];
			} else {
				return { valid: false, message: 'file must have only one feature, ' + layer.data.features.length + ' found'};
			}
		} else {
			feature = layer.data;
		}
	
		// Then check feature is geojson
		if ( feature.type != 'Feature' ) {
			return { valid: false, message: 'invalid feature' };
		}
	
		// Then check feature is polygon
		if ( feature.geometry.type != 'Polygon' ) {
			return { valid: false, message: 'feature must be a polygon' };
		}
		
		return { valid: true, feature: feature };
	},
	
	// Callback called when a file is loaded
	onFileLoaded: function(layer,file) {
	
		// Remove previous imported layer if any
		if ( this.importedLayer ) {
			Map.removeLayer(this.importedLayer);
			this.importedLayer = null;
		}
		
		var res = this.getImportedFeature(layer);
		if (!res.valid) {
			$('#importMessage').html('Failed to import ' + file.name + ' : ' + res.message + '.' );
		} else {
			// Set the polygon on the model
			this.model.set("polygon",res.feature.geometry.coordinates);
			// Keep the imported polygon (to be re-used when user click between the serveral tools)
			this.importedPolygon = res.feature.geometry.coordinates;
			$('#importMessage').html("File sucessfully imported : " + file.name);
			layer.name = 'Imported search area (' + file.name + ')';
			Map.addLayer(layer);
			this.importedLayer = layer;
			Map.zoomToFeature(res.feature);
		}
		
	},

	// Synchronize map extent
    synchronizeWithMapExtent : function(){
    	var mapExtent = Map.getViewportExtent();
		this.model.set({"west" : mapExtent[0]});
		this.model.set({"south" : mapExtent[1]});
		this.model.set({"east" : mapExtent[2]});
		this.model.set({"north" : mapExtent[3]});
		
		$("#west").val(mapExtent[0]);
		$("#south").val(mapExtent[1]);
		$("#east").val(mapExtent[2]);
		$("#north").val(mapExtent[3]);
    }
	
});

return SpatialExtentView;

});