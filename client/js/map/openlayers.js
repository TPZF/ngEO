/**
 * OpenLayers map engine
 */

var Configuration = require('configuration');
var MapUtils = require('map/utils');
//require('OpenLayers');

var _projection = Configuration.get('map.projection', "EPSG:4326");

/**
 * Setup the resolution to be used by a WMTS layer using the grid for the given projection
 */
var _buildWMTSResolution = function() {
	if (_projection == "EPSG:4326") {
		var resolutions = [180.0 / 256];
		for (var i = 0; i < 15; i++) {
			resolutions.push(resolutions[resolutions.length - 1] * 0.5);
		}
		return resolutions;
	} else {
		//console.log("WMTS : no resolution exists for this projection  : " + _projection);
		return null;
	}
};

/**
 * Setup WMTS
 */
var _setupWMTS = function(config) {
	config.serverResolutions = _buildWMTSResolution();
	if (_projection == "EPSG:4326") {
		config.tileFullExtent = new OpenLayers.Bounds(-180, -90, 180, 90);
		config.tileOrigin = new OpenLayers.LonLat(-180, 90);
	} else if ( _projection == "EPSG:3857" ) {
		config.tileFullExtent = new OpenLayers.Bounds(-20037508.34278925, -20037508.34278925, 20037508.34278925, 20037508.34278925);
		config.tileOrigin = new OpenLayers.LonLat( -20037508.34278925, 20037508.34278925 );
	} /* else {
		console.log("WMTS : no setup exists for this projection  : " + _projection);
	} */
}

/**
 * Constructor
 * parentElement : the parent element div for the map
 */
OpenLayersMapEngine = function(element) {
	// Store element
	this.element = element;

	// Retreive restricted extent from configuration
	var resExtent = Configuration.get('map.openlayers.restrictedExtent', [-180, -90, 180, 90]);

	// Get projection
	var mapProjection = new OpenLayers.Projection(Configuration.get('map.projection', "EPSG:4326"));
	var displayProjection = new OpenLayers.Projection("EPSG:4326");

	// Transform restricted extent to the map projection
	var restrictedExtent = new OpenLayers.Bounds(resExtent);
	restrictedExtent.transform(displayProjection, mapProjection);

	// Setup the best resolutions to use with the following constraint :
	// fit the WMTS layers and depends on the viewport size
	var resolutions = this.computeResolutions(restrictedExtent);

	// Create the map
	this._map = new OpenLayers.Map(this.element, {
		controls: [
			new OpenLayers.Control.Navigation({
				zoomWheelEnabled: true,
				defaultDblClick: function(event) { return; }
			}),
			new OpenLayers.Control.Attribution()
		],
		projection: mapProjection,
		displayProjection: displayProjection,
		restrictedExtent: restrictedExtent,
		theme: null,
			// NEVER USE fractionnal zoom right now, break the WMTS display as overlay
			// fractionalZoom: true,
		autoUpdateSize: false,
		resolutions: resolutions,
		fallThrough: true
	});

	// Create the converter for GeoJSON format
	this._geoJsonFormat = new OpenLayers.Format.GeoJSON({
		externalProjection: this._map.displayProjection,
		internalProjection: this._map.projection
	});

	this._styles = {};
};


/**
 * Compute the resolutions array from the given extent and the element size
 */
OpenLayersMapEngine.prototype.computeResolutions = function(restrictedExtent) {
	// Setup the resolution, the same as used for WMTS
	var resolutions = _buildWMTSResolution();

	if (resolutions) {

		// Compute the max resolution
		var maxWRes = (restrictedExtent.right - restrictedExtent.left) / this.element.offsetWidth;
		var maxHRes = (restrictedExtent.top - restrictedExtent.bottom) / this.element.offsetHeight;
		var maxResolution = Math.min(maxWRes, maxHRes)

		// Modify the resolutions array to be strictly inferior to maxResolution
		while (resolutions[0] > maxResolution) {
			resolutions.shift();
		}

	}

	return resolutions;
};

/**
 * Add a style
 */
OpenLayersMapEngine.prototype.addStyle = function(name, style) {
	this._styles[name] = new OpenLayers.StyleMap(style);
};

/**
 * Set the background layer
 */
OpenLayersMapEngine.prototype.setBackgroundLayer = function(layer) {

	var olLayer;
	switch (layer.type.toUpperCase()) {
		case "OSM":
			olLayer = new OpenLayers.Layer.OSM(layer.name, layer.baseUrl + "/${z}/${x}/${y}.png");
			break;
		case "WMS":
			olLayer = new OpenLayers.Layer.WMS(layer.name, layer.baseUrl, layer.params);
			break;
		case "BING":
			olLayer = new OpenLayers.Layer.Bing({
				name: layer.name,
				key: layer.key,
				type: layer.imageSet
			});
			break;
		case "WMTS":
			var config = {
				name: layer.name,
				url: layer.baseUrl,
				layer: layer.params.layer,
				matrixSet: layer.params.matrixSet,
				matrixIds: layer.params.matrixIds,
				format: layer.params.format,
				style: layer.params.style,
				isBaseLayer: true,
				projection: layer.projection
			};

			_setupWMTS(config);

			// Manage bbox(not really useful since background layer is generally covers a whole world, but just in case..)
			if (layer.bbox) {
				config.maxExtent = new OpenLayers.Bounds(layer.bbox);
			}

			olLayer = new OpenLayers.Layer.WMTS(config);

			break;
	}

	if (olLayer) {
		// Set common options
		olLayer.attribution = layer.attribution;
		olLayer.wrapDateLine = true;
		olLayer.transitionEffect = Configuration.get('map.openlayers.transitionEffect', null);

		// Finally add to map
		this._map.addLayer(olLayer);
		this._map.setBaseLayer(olLayer);

		// Fix wrong TILEMATRIX identifier for (at least) WMTS layer when it has been set on initialization
		// FIXME: Check if there is no better way to handle it..
		if ( olLayer.updateMatrixProperties ) {
			olLayer.updateMatrixProperties();
		}
	}
	return olLayer;
}

/**
 * Set layer visibility
 */
OpenLayersMapEngine.prototype.setLayerVisible = function(olLayer, vis) {
	olLayer.setVisibility(vis);
}

/**
 * Set layer index
 */
OpenLayersMapEngine.prototype.setLayerIndex = function(olLayer, index) {
	this._map.setLayerIndex(olLayer, index);
}

/**
 * Add a layer
 */
OpenLayersMapEngine.prototype.addLayer = function(layer) {

	var olLayer;
	switch (layer.type.toUpperCase()) {
		case "WMS":
			var maxExtent;
			if (layer.bbox) {
				maxExtent = new OpenLayers.Bounds(layer.bbox[0], layer.bbox[1], layer.bbox[2], layer.bbox[3]);
				maxExtent.transform(this._map.displayProjection, this._map.projection);
			}
			olLayer = new OpenLayers.Layer.WMS(layer.name,
				layer.baseUrl,
				layer.params, {
					maxExtent: maxExtent,
					isBaseLayer: false,
					opacity: layer.hasOwnProperty('opacity') ? layer.opacity : 1.0
				});
			break;
		case "WMTS":
			var config = {
				name: layer.name,
				url: layer.baseUrl,
				layer: layer.params.layer,
				matrixSet: layer.params.matrixSet,
				matrixIds: layer.params.matrixIds,
				format: layer.params.format,
				style: layer.params.style,
				isBaseLayer: false,
				projection: layer.projection,
				opacity: layer.hasOwnProperty('opacity') ? layer.opacity : 1.0,
				transitionEffect: Configuration.get('map.openlayers.transitionEffect', null)
			};

			_setupWMTS(config);

			// Manage time
			if (layer.params.time) {
				config.dimensions = ['TIME'];
				config.params = {
					'TIME': layer.params.time
				};
			}

			// Manage bbox
			if (layer.bbox) {
				config.maxExtent = new OpenLayers.Bounds(layer.bbox).transform(this._map.displayProjection, this._map.projection);
			}
			olLayer = new OpenLayers.Layer.WMTS(config);
			break;
		case "GEORSS":
			//olLayer = new OpenLayers.Layer.GeoRSS(layer.name, layer.location, { projection: "EPSG:4326" });	
			olLayer = new OpenLayers.Layer.Vector(layer.name, {
				strategies: [new OpenLayers.Strategy.Fixed()],
				protocol: new OpenLayers.Protocol.HTTP({
					url: layer.location,
					format: new OpenLayers.Format.GeoRSS()
				}),
				projection: "EPSG:4326"
			});

			break;
		case "WFS":
			olLayer = new OpenLayers.Layer.Vector(layer.name, {
				strategies: [new OpenLayers.Strategy.Fixed()],
				protocol: new OpenLayers.Protocol.WFS({
					url: layer.baseUrl,
					featureType: layer.featureType,
					featureNS: layer.featureNS
				}),
				projection: "EPSG:4326"
			});
			break;
		case "KML":
			if (layer.data) {
				var kmlFormat = new OpenLayers.Format.KML({
					extractStyles: true,
					extractAttributes: true,
					maxDepth: 0
				});
				var features = kmlFormat.read(layer.data);
				olLayer = new OpenLayers.Layer.Vector(layer.name, {
					projection: "EPSG:4326"
				});
				olLayer.addFeatures(features);
			} else if (layer.location) {
				olLayer = new OpenLayers.Layer.Vector(layer.name, {
					strategies: [new OpenLayers.Strategy.Fixed()],
					protocol: new OpenLayers.Protocol.HTTP({
						url: layer.location,
						format: new OpenLayers.Format.KML({
							extractStyles: true,
							extractAttributes: true,
							maxDepth: 0
						})
					}),
					projection: "EPSG:4326"
				});
			}
			break;
		case "FEATURE":
		case "JSON":
		case "GEOJSON":
			olLayer = new OpenLayers.Layer.Vector(layer.name, {
				// Use "canvas" renderer since "SVG" has a bug while rendering features crossing the dateline
				// Pros: no more bug. Cons: Less performant
				// @see https://github.com/openlayers/openlayers/issues/668
				renderers: ['Canvas', 'VML'],
				projection: "EPSG:4326"
			});
			if (layer.data) {
				var geojsonFormat = new OpenLayers.Format.GeoJSON();
				var features = geojsonFormat.read(layer.data);
				olLayer.addFeatures(features);
			}
	}

	if (olLayer) {

		// Set common options
		olLayer.attribution = layer.attribution;
		if (layer.style && this._styles[layer.style]) {
			olLayer.styleMap = this._styles[layer.style];
		}
		olLayer.setVisibility(layer.visible);

		// Finally add to map
		this._map.addLayer(olLayer);
	}

	return olLayer;
}

/**
 * Remove layer from the map engine
 */
OpenLayersMapEngine.prototype.removeLayer = function(olLayer) {
	olLayer.destroy();
}

/**
 * Subscribe to OpenLayersMap events
 */
OpenLayersMapEngine.prototype.subscribe = function(name, callback) {
	switch (name) {
		case "init":
			callback(this);
			break;
		case "navigationModified":
			// Attach events for navigation change
			this._map.events.register("move", undefined, callback);
			break;
		case "mousedown":
		case "mouseup":
		case "mousemove":
		case "click":
		case "dblclick":
			this._map.events.register(name, undefined, callback, true);
			break;
	}
}

/**
 * Subscribe to OpenLayersMap events
 */
OpenLayersMapEngine.prototype.unsubscribe = function(name, callback) {
	switch (name) {
		case "navigationModified":
			// Detach events for navigation change
			this._map.events.unregister("move", undefined, callback);
			break;
		case "mousedown":
		case "mouseup":
		case "mousemove":
		case "click":
		case "dblclick":
			this._map.events.unregister(name, undefined, callback, true);
			break;
	}
}


/**
 * Update the size of the map
 */
OpenLayersMapEngine.prototype.updateSize = function() {
	// Update the resolutions array
	this._map.resolutions = this.computeResolutions(this._map.restrictedExtent);
	this._map.baseLayer.initResolutions();

	// Then update the size
	this._map.updateSize();
}

/**
 * Get lon lat from pixel
 */
OpenLayersMapEngine.prototype.getLonLatFromPixel = function(x, y) {
	var olLonLat = this._map.getLonLatFromPixel(new OpenLayers.Pixel(x, y));
	olLonLat = olLonLat.transform(this._map.projection, this._map.displayProjection);
	return [olLonLat.lon, olLonLat.lat];
}

/**
 * Get pixel from lonlat
 */
OpenLayersMapEngine.prototype.getPixelFromLonLat = function(lon, lat) {
	var olLonLat = new OpenLayers.LonLat(lon, lat);
	olLonLat = olLonLat.transform(this._map.displayProjection, this._map.projection);
	var olPixel = this._map.getPixelFromLonLat(olLonLat);
	return {
		x: olPixel.x,
		y: olPixel.y
	};
}

/**
 * Get the current viewport extent
 */
OpenLayersMapEngine.prototype.getViewportExtent = function() {
	var boundsOrig = this._map.getExtent();
	if (boundsOrig) {
		var extent = [];
		//
		var bounds = boundsOrig.transform(this._map.projection, this._map.displayProjection);

		var w = Math.abs(bounds.getWidth());
		var h = Math.abs(bounds.getHeight());
		extent[0] = bounds.getCenterLonLat().lon - 0.5 * w;
		extent[1] = bounds.getCenterLonLat().lat - 0.5 * h;
		extent[2] = bounds.getCenterLonLat().lon + 0.5 * w;
		extent[3] = bounds.getCenterLonLat().lat + 0.5 * h;
		return extent;
	} else {
		return null;
	}
}

/**
 * Zoom to the given extent
 */
OpenLayersMapEngine.prototype.zoomToExtent = function(extent) {
	var bounds = new OpenLayers.Bounds(extent[0], extent[1], extent[2], extent[3]);
	bounds.transform(this._map.displayProjection, this._map.projection);
	var center = bounds.getCenterLonLat();
	this._map.setCenter(center, this._map.getZoomForExtent(bounds, true));
}


/**
 * Zoom in
 */
OpenLayersMapEngine.prototype.zoomIn = function() {
	this._map.zoomIn();
}

/**
 * Zoom out
 */
OpenLayersMapEngine.prototype.zoomOut = function() {
	this._map.zoomOut();
}

/**
 * Remove all features from a layer
 */
OpenLayersMapEngine.prototype.removeAllFeatures = function(layer) {
	layer.removeAllFeatures();
}

/**
 * Add a feature on the map
 */
OpenLayersMapEngine.prototype.addFeature = function(layer, feature) {
	var olFeatures = this._geoJsonFormat.read(MapUtils.fixDateLine(feature));
	layer.addFeatures(olFeatures);

}

/**
 * Modify the feature style
 */
OpenLayersMapEngine.prototype.modifyFeatureStyle = function(layer, feature, style) {
	var olFeature = layer.getFeatureByFid(feature.id);
	if (olFeature) {
		olFeature.renderIntent = style;
		layer.drawFeature(layer.getFeatureByFid(feature.id), style);
	}
}

/**
 * Block the navigation
 */
OpenLayersMapEngine.prototype.blockNavigation = function(flag) {
	if (flag) {
		this._map.controls[0].deactivate();
	} else {
		this._map.controls[0].activate();
	}
}

/**
 * Update a feature
 */
OpenLayersMapEngine.prototype.updateFeature = function(layer, feature, customFixDateLine) {
	if (customFixDateLine) {
		feature = customFixDateLine(feature);
	} else {
		feature = MapUtils.fixDateLine(feature);
	}
	var olFeature = layer.getFeatureByFid(feature.id);
	layer.removeFeatures(olFeature);
	layer.addFeatures(this._geoJsonFormat.read(feature));
}

/**
 * Remove a feature
 */
OpenLayersMapEngine.prototype.removeFeature = function(layer, feature) {
	var olFeature = layer.getFeatureByFid(feature.id);
	layer.removeFeatures(olFeature);
}

/**
 * Destroy the map
 */
OpenLayersMapEngine.prototype.destroy = function() {
	this._map.destroy();
	this.element.className = "";
}

module.exports = OpenLayersMapEngine;