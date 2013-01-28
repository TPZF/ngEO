

define( ['jquery', 'backbone', 'map/map', 'map/layerImport', 'map/geojsonconverter', 'map/gazetteer',
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Map, LayerImport, GeoJSONConverter, Gazetteer, areaCriteria_template) {

var SpatialExtentView = Backbone.View.extend({

	// The model is a DatasetSearch
	
	// Constructor
	initialize : function(options) {
	
		this.importedLayer = null;
		this.searchAreaLayer = null;
		this.mode = "bbox";
		
		// Listen when the searchArea has changed to update the view
		this.model.on("change:searchArea",  this.onModelChanged, this);
		
		// Listen when useExtent is changed to update the view
		this.model.on("change:useExtent",  function() {
			var useExtent = $('#mapExtentCheckBoxLabel').hasClass('ui-checkbox-on');
			if ( useExtent != this.model.get('useExtent') ) {
				$('#mapExtentCheckBoxLabel').trigger('click');
			}
		}, this);
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
		'blur #bbox input' : function(event){
			this.model.searchArea.setBBox({
				west : $("#west").val(),
				south: $("#south").val(),
				east: $("#east").val(),
				north: $("#north").val()
			});
			this.updateSearchAreaLayer();

		},
			
		'click #mapExtentCheckBoxLabel' : function(event){
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({"useExtent" : useExtent}, { silent: true });
			if ( useExtent ) {
				this.synchronizeWithMapExtent();
				Map.on("endNavigation", this.synchronizeWithMapExtent, this);
				// Remove the search area layer
				Map.removeLayer(this.searchAreaLayer);
			} else {
				Map.off("endNavigation", this.synchronizeWithMapExtent, this);
				this.updateSearchAreaLayer();
			}
		},

		'click #gazetteer-results li' : function(event){		
			var $target = $(event.currentTarget);			
			if ( !$target.hasClass('ui-btn-active') ) {
				this.selectGazetteerResult( $target );
			}
		},
		
		'blur #polygontext': function(event) {
			this.model.searchArea.setPolygonFromText( $(event.currentTarget).val() );
			this.updateSearchAreaLayer();
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
		if ( $item.length == 0 )
			return;
			
		$item.parent().find('.ui-btn-active').removeClass('ui-btn-active');
		$item.addClass('ui-btn-active');
		var data = $item.data('data');
		
		if ( data.geotext ) {
			this.model.searchArea.setFromWKT(data.geotext,true);
			this.updateSearchAreaLayer();
		} else {	
			var south = parseFloat(data.boundingbox[0]);
			var north = parseFloat(data.boundingbox[1]); 
			var west = parseFloat(data.boundingbox[2]);
			var east = parseFloat(data.boundingbox[3]);
			
			this.model.searchArea.setBBox({
				west : west,
				south: south,
				east: east,
				north: north
			});
			this.updateSearchAreaLayer();
		}
	},
	
	/**
	 * Update the search area layer
	 */
	updateSearchAreaLayer: function() {
		if ( this.searchAreaLayer ) {
			Map.removeLayer( this.searchAreaLayer );
		} else {
			
			// Fill the layer description
			this.searchAreaLayer = {
				name: "Search Area",
				type: "GeoJSON",
				visible: true,
				style: "imported",
				data: {
					type: "FeatureCollection",
					features: [ this.model.searchArea.getFeature() ]
				}
			};
		}
		Map.addLayer( this.searchAreaLayer );
		Map.zoomTo( this.model.searchArea.getFeature().bbox );
	},
	
	/**
	 * Update the model after the mode have been changed
	 * TODO : improve design
	 */
	updateModel: function(prevMode,newMode) {
		// Clean-up previous mode
		switch (prevMode) {
			case "bbox":
				if ( this.model.get("useExtent") ) {
					Map.off("endNavigation", this.synchronizeWithMapExtent, this);
				}
				break;
		}
		// Setup new mode
		switch (newMode) {
			case "bbox": 
				if (this.model.get("useExtent")) {
					Map.on("endNavigation", this.synchronizeWithMapExtent, this);
					this.synchronizeWithMapExtent();
					// Remove the search area layer
					Map.removeLayer(this.searchAreaLayer);
				} else {
					this.model.searchArea.setBBox({
						west : $("#west").val(),
						south: $("#south").val(),
						east: $("#east").val(),
						north: $("#north").val()
					});
				}
				break;
			
			case "import":
				if ( this.importedLayer ) {
					this.model.searchArea.setFromLayer(this.importedLayer);
				}
				break;
				
			case "polygon":
				var text = this.$el.find('#polygontext').val();
				if ( text && text != "" ) {
					this.model.searchArea.setPolygonFromText( text );
				}
				break;
				
			case "gazetteer":
				var $item = $('#gazetteer-results').find('li.ui-btn-active');
				if ( $item.length > 0 ) {
					this.selectGazetteerResult($item);
				}
				break;
		}
		
		// Update the search area layer
		if (!this.model.get("useExtent")) {
			this.updateSearchAreaLayer();
		}
	},
	
	// Called when model has changed
	onModelChanged: function() {
		if ( this.model.searchArea.getMode() == 0 ) {
			var bbox = this.model.searchArea.getBBox();
			$("#west").val( bbox.west );
			$("#south").val( bbox.south );
			$("#east").val( bbox.east );
			$("#north").val( bbox.north );
		} else if ( this.model.searchArea.getMode() == 1 ) {
			$('#polygontext').val( this.model.searchArea.getPolygonText() );
			$('#radio-polygon-label').trigger('click'); 
		}
		if (!this.model.get("useExtent")) {
			this.updateSearchAreaLayer();
		}
	},
		
	// Build the view
	render: function(){

		this.$el.append(_.template(areaCriteria_template, this.model));
		
		// Set the default selected tool between bbox, polygon, gazetteer, import
		this.$el.find('#gazetteer').hide();
		this.$el.find('#import').hide();
		this.$el.find('#polygon').hide();
		this.$selectedTool = this.$el.find('#bbox');
				
		// Setup the drop are for import
		LayerImport.addDropArea( $('#dropZone').get(0), $.proxy(this.onFileLoaded,this) );
		
		// Synchronize with use extent
		if (this.model.get("useExtent")) {
			Map.on("endNavigation", this.synchronizeWithMapExtent, this);
			this.synchronizeWithMapExtent();
		}
		
		return this;
	},
	
	// Callback called when a file is loaded
	onFileLoaded: function(layer,file) {
		this.importedLayer = layer;
		var res = this.model.searchArea.setFromLayer(layer);
		if (!res.valid) {
			$('#importMessage').html('Failed to import ' + file.name + ' : ' + res.message + '.' );
		} else {
			$('#importMessage').html("File sucessfully imported : " + file.name);
			this.updateSearchAreaLayer();
		}		
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

return SpatialExtentView;

});