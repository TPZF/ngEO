/**
 * Map module
 * The function to define the map module
 */


var Configuration = require('configuration');
var OpenLayersMapEngine = require('map/openlayers');
var GlobWebMapEngine = require('map/globweb');
var UserPrefs = require('userPrefs');
var BrowsesLayer = require('map/browsesLayer');
var MapUtils = require('map/utils');
var DegreeConvertor = require('map/degreeConvertor');


/**
 * Inner class
 */

/**
 * A basic static layer only for visualisation
 */
var Layer = function(params, engineLayer) {

	// The parameters of layer (name, visibility, type...)
	this.params = params;
	// The engine layer
	this.engineLayer = engineLayer;

	this.setVisible = function(vis) {
		this.params.visible = vis;

		if ( this.params.type != "Feature" ) {
			// Store only raster layers into user preferences for now
			var visibleLayers = JSON.parse(UserPrefs.get("Visible layers") || "[]");
			if ( vis ) {
				visibleLayers.push(this.params.name);
			} else {
				var idx = visibleLayers.indexOf(this.params.name);
				if ( idx != -1 ) {
					visibleLayers.splice(idx, 1);
				}
			}
			UserPrefs.save("Visible layers", JSON.stringify(visibleLayers));
		}

		mapEngine.setLayerVisible(this.engineLayer, vis);
		self.trigger("visibility:changed", this);
	};
	this.changeEngine = function(mapEngine) {
		this.engineLayer = mapEngine.addLayer(this.params);
	};
};

/**
 *	Tesselate great circle helper function
 *	NGEO-808: Fixes the rhumb line(constant azimuth) feature geometry to follow the great circles one
 *	@see http://it.mathworks.com/help/map/great-circles-rhumb-lines-and-small-circles.html
 *
 *	Also adds _origGeometry attribute on feature to be used on export
 */
var tesselateGreatCircle = function(params, feature) {
	var needToBeTesselated = (params.greatCircle && !feature._origGeometry);
	if (needToBeTesselated) {
		// NGEO-1778: Store original geometry on feature, used on KML/GeoJSON/other export
		feature._origGeometry = {
			coordinates: $.extend(true, [], feature.geometry.coordinates),
			type: feature.geometry.type
		};
		MapUtils.tesselateGreatCircle(feature);
	}
}

/**
 * A feature layer to add dynamically new feature
 */
var FeatureLayer = function(params, engineLayer) {
	Layer.prototype.constructor.call(this, params, engineLayer);

	// The features
	this.features = [];

	this.clear = function() {
		this.features = [];
		mapEngine.removeAllFeatures(this.engineLayer);
	};
	this.addFeatures = function(features) {
		for (var i = 0; i < features.length; i++) {
			this.addFeature(features[i]);
		}
	};
	this.addFeature = function(feature) {
		if (feature.geometry) {
			tesselateGreatCircle(params, feature);
			mapEngine.addFeature(this.engineLayer, feature);
			this.modifyFeaturesStyle([feature], "default");
			this.features.push(feature);
		}
	};
	this.removeFeatures = function(features) {
		for (var i = 0; i < features.length; i++) {
			mapEngine.removeFeature(this.engineLayer, features[i]);
			this.features.splice(this.features.indexOf(features[i]), 1);
		}
	};

	this.modifyFeaturesStyle = function(features, style) {
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];
			let _myFeat = _.find(this.features, function(_f) {
				return _f.id === feature.id;
			});
			if (_myFeat) {
				_myFeat.renderHint = style;
				style = mapEngine.applyConditionalStyling(this.engineLayer, _myFeat, style);
				//feature.renderHint = style;
				mapEngine.modifyFeatureStyle(this.engineLayer, _myFeat, style);
			}
		}
	};
	this.updateFeature = function(feature, customFixDateLine) {
		tesselateGreatCircle(params, feature);
		mapEngine.updateFeature(this.engineLayer, feature, customFixDateLine);
	};
	this.changeEngine = function(mapEngine) {
		this.engineLayer = mapEngine.addLayer(this.params);
		// Re-add the features to the engine
		for (var i = 0; i < this.features.length; i++) {
			var f = this.features[i];
			f.geometry = _.omit(f.geometry, '_bucket', '_tileIndices');
			mapEngine.addFeature(this.engineLayer, f);
			if (f.renderHint) {
				mapEngine.modifyFeatureStyle(this.engineLayer, f, f.renderHint);
			}
		}
	};
};


/**
 * Private attributes
 */

// Reference to the map singleton
var self = null;
// The different engines used by the map
var engines = {
	'2d': OpenLayersMapEngine,
	'3d': GlobWebMapEngine,
};
// The current map engine
var mapEngine = null;
// The map DOM element
var element = null;
// The current background layer
var backgroundLayer = null;
// Max extent of the map
var maxExtent = [-180, -85, 180, 85];
// To know if map is in geographic or not
var isGeo = false;

/**
 * Build the layer from its parameter
 */
var buildLayer = function(params) {
	if (params.type == "Browses") {
		return new BrowsesLayer(params, mapEngine);
	} else if (params.type == "Feature") {
		return new FeatureLayer(params, mapEngine.addLayer(params));
	} else {
		var engineLayer = mapEngine.addLayer(params);
		if (engineLayer) {
			return new Layer(params, engineLayer);
		}
	}
};

/**
 * Called when mouse is moved on map : update coordinates viewer
 */
var onMouseMove = function(event) {
	var point = self.getLonLatFromEvent(event);

	if (point) {
		var lon = DegreeConvertor.toDMS(point[0], true);
		var lat = DegreeConvertor.toDMS(point[1], false);

		// Append zero before decimals < 10 to have the same width 
		lon = lon.replace(/\b(\d{1})\b/g, '0$1');
		lat = lat.replace(/\b(\d{1})\b/g, '0$1');

		$('#coordinatesViewer')
			.html(lat + " " + lon);
	}
};

/**
 * Configure the map engine : set background layer, adjust style, connect events, etc...
 */
var configureMapEngine = function(mapConf) {

	mapEngine.setBackgroundLayer(backgroundLayer);

	// Add the style in conf to the engines
	for (var x in mapConf.styles) {
		if (mapConf.styles.hasOwnProperty(x)) {
			mapEngine.addStyle(x, mapConf.styles[x]);
		}
	}

	// Change the layer engine
	for (var i = 0; i < self.layers.length; i++) {
		self.layers[i].changeEngine(mapEngine);
	}

	// Zoom to max extent
	mapEngine.zoomToExtent(maxExtent);

	// Subscribe to event
	mapEngine.subscribe("navigationModified", function() {
		self.trigger("extent:change", self);
	});

	// Update coordinates viewer context on mouse move
	mapEngine.subscribe("mousemove", onMouseMove);
};

/**
 * Check if layers are compatible
 */
var isLayerCompatible = function(layer) {
	switch (layer.type) {
		case "Bing":
		case "OSM":
			return !isGeo;
		case "WMTS":
			return Configuration.data.map.projection == layer.projection;
		case "WMS":
			return layer.projection ? Configuration.data.map.projection == layer.projection : true;
		case "GeoJSON":
		case "KML":
		case "GeoRSS":
		case "WFS":
			return true;
		default:
			return false;
	}
}

/**
 * Public interface
 */
module.exports = {

	/**
	 * The handler used for interaction with the map : selection, polygon drawing, etc..
	 */
	handler: null,

	/**
	 * The background layers that can be used on the map.
	 * Loaded from configuration, this array only stores the 'compatible' background layers
	 */
	backgroundLayers: [],

	/**
	 * The layers applied on the map.
	 * Loaded from configuration, this array only stores the 'compatible' layers
	 */
	layers: [],

	/**
	 * Initialize module
	 */
	initialize: function(eltId) {

		// Keep the this
		self = this;

		_.extend(self, Backbone.Events);

		element = document.getElementById(eltId);

		var preferedMapEngine = UserPrefs.get("Map mode") ? UserPrefs.get("Map mode") : '2d';
		mapEngine = new engines[preferedMapEngine](element);

		// Check layers from configuration
		isGeo = Configuration.data.map.projection == "EPSG:4326";

		// Build the background layers from the configuration
		var confBackgroundLayers = Configuration.data.map.backgroundLayers;
		for (var i = 0; i < confBackgroundLayers.length; i++) {
			if (isLayerCompatible(confBackgroundLayers[i])) {
				self.backgroundLayers.push(confBackgroundLayers[i]);
			}
		}

		var visibleLayers = JSON.parse(UserPrefs.get("Visible layers") || "[]");
		// Build the addtionnal layers from the configuration
		var confLayers = Configuration.data.map.layers;
		for (var i = 0; i < confLayers.length; i++) {
			var layerConf = confLayers[i];
			if (isLayerCompatible(layerConf)) {

				// Update visibilty according to user preferences
				if ( visibleLayers.indexOf(layerConf.name) != -1 ) {
					layerConf.visible = true;
				}

				self.layers.push(new Layer(layerConf, null));
			}
		}

		// Set the background layer from the preferences if it exists,
		// otherwise set it to be the first one in the list of background layers
		var preferedBackgroundId = UserPrefs.get("Background");
		backgroundLayer = _.findWhere(self.backgroundLayers, {id: preferedBackgroundId});
		if ( !backgroundLayer ) {
			backgroundLayer = self.backgroundLayers[0];
		}

		configureMapEngine(Configuration.data.map);
	},

	/**
	 * Modify the background layer on the map and save it to the preferences.
	 *
	 * @param layer The layer to use as new background
	 */
	setBackgroundLayer: function(layer) {
		// Store background layer
		backgroundLayer = layer;
		// Set the active background
		var engineLayer = mapEngine.setBackgroundLayer(layer);
		UserPrefs.save('Background', layer.id);
		this.trigger('backgroundLayerSelected', layer);
		return engineLayer;
	},

	/**
	 * Get the selected background layer
	 */
	getBackgroundLayer: function() {
		return backgroundLayer;
	},

	/**
	 * Dynamically add a layer to the map
	 *
	 * @param layerDesc	The layer description
	 */
	addLayer: function(params) {
		var layer;
		if (!params.isBackground) {
			layer = buildLayer(params);
			self.layers.push(layer);
			self.trigger('layerAdded', layer);
			//console.log(layer.engineLayer.id + " added");
		} else {
			if (params.visible)
				layer = this.setBackgroundLayer(params);
			self.backgroundLayers.push(params);
			self.trigger('backgroundLayerAdded', params);
		}

		return layer;
	},

	/**
	 * Dynamically remove a layer from the map
	 *
	 * @param layer The layer (as returned by addLayer)
	 */
	removeLayer: function(layer) {
		if (!layer.params.isBackground) {
			//console.log("Try to remove" + layer.engineLayer.id);
			//var layer = _.findWhere(self.layers, {params: layerDesc});
			var index = self.layers.indexOf(layer);
			if (index >= 0) {
				var layer = self.layers[index];
				if (layer.clear) {
					layer.clear();
				}
				if (layer.engineLayer) {
					mapEngine.removeLayer(layer.engineLayer);
				}
				var index = self.layers.indexOf(layer);
				self.layers.splice(index, 1);
				self.trigger('layerRemoved', layer);
				return true;
			}
		} else {
			var index = self.backgroundLayers.indexOf(layer.params);
			// var index = self.backgroundLayers.indexOf(layerDesc);
			var layer = self.backgroundLayers[index];
			if (index >= 0) {
				self.backgroundLayers.splice(index, 1);

				// Check first one by default
				if (backgroundLayer == layer.params) {
					self.setBackgroundLayer(self.backgroundLayers[0]);
				}
				self.trigger('backgroundLayerRemoved', layer);
			}
			return true;
		}
		return false;
	},

	zoomIn: function() {
		mapEngine.zoomIn();
	},

	zoomOut: function() {
		mapEngine.zoomOut();
	},

	zoomToMaxExtent: function() {
		mapEngine.zoomToExtent(maxExtent);
	},

	zoomToFeature: function(feature) {
		// Zoom on the product in the carto
		if (!feature.bbox) {
			MapUtils.computeExtent(feature);
		}
		var extent = feature.bbox;
		var width = extent[2] - extent[0];
		var height = extent[3] - extent[1];
		var offsetExtent = [extent[0] - 2 * width, extent[1] - 2 * height, extent[2] + 2 * width, extent[3] + 2 * height];
		mapEngine.zoomToExtent(offsetExtent);
	},

	zoomTo: function(extent) {
		mapEngine.zoomToExtent(extent);
	},

	/**
	 * Get current viewport extent
	 * @return an array of 4 number : [west,south,east,north]
	 */
	getViewportExtent: function() {
		var extent = mapEngine.getViewportExtent();
		extent[0] = MapUtils.normalizeLon(extent[0]);
		extent[1] = Math.max(-90.0, extent[1]);
		extent[2] = MapUtils.normalizeLon(extent[2]);
		extent[3] = Math.min(90.0, extent[3]);
		return extent;
	},

	/**
	 * Get the pixel position (in the element) from a lonlat
	 */
	getPixelFromLonLat: function(lon, lat) {
		return mapEngine.getPixelFromLonLat(lon, lat);
	},

	/**
	 * Get the lonlat from a pixel position (in the element) 
	 */
	getLonLatFromPixel: function(x, y) {
		return mapEngine.getLonLatFromPixel(x, y);
	},

	/**
	 * Get the lonlat from an event
	 */
	getLonLatFromEvent: function(event) {
		var rect = element.getBoundingClientRect();
		var clientX = event.pageX - rect.left;
		var clientY = event.pageY - rect.top;
		return mapEngine.getLonLatFromPixel(clientX, clientY);
	},

	/**
	 * Switch the map engine
	 */
	switchMapEngine: function(id) {
		if (!engines[id]) {
			return false;
		}

		var previousHandler = null;

		if (mapEngine) {
			// Stop current handler because it depends on the map engine
			if (this.handler) {
				previousHandler = this.handler;
				this.handler.stop();
			}

			// Unsubscribe old on mouse move handler
			mapEngine.unsubscribe("mousemove", onMouseMove);

			// Retrieve the current viewport extent
			var extent = mapEngine.getViewportExtent();

			// Destroy the old map engine
			mapEngine.destroy();
			mapEngine = null;

		}

		// Callback called by the map engine when the map engine is initialized
		var initCallback = function(map) {
			// Configure the map engine
			configureMapEngine(Configuration.data.map);

			// Zoom to previous extent
			if (extent)
				map.zoomToExtent(extent);

			if (previousHandler)
				previousHandler.start();

		};

		// Create the new engine and catch any error
		try {
			mapEngine = new engines[id](element);
		} catch (err) {
			mapEngine = null;
		}

		UserPrefs.save("Map mode", id);

		if (mapEngine) {
			mapEngine.subscribe("init", initCallback);
		}

		return mapEngine != null;
	},

	/**
	 * Method to call when the map viewport is resized
	 */
	updateViewportSize: function() {
		if (mapEngine)
			mapEngine.updateSize();
	},

	getMapEngine: function() {
		return mapEngine;
	}
};