/**
 * GlobWeb map engine
 */


var Configuration = require('configuration');
var GeojsonConverter = require('map/geojsonconverter');
//require('GlobWeb.min');

var baseZIndex = 365; // "Magic number" to make WMS/WMTS always on top

/**
 * GlobeWeb Map Engine constructor
 * parentElement : the parent element div for the map
 */
GlobWebMapEngine = function(parentElement) {
	this.groundOverlays = {};
	this.features = {};
	this.styles = {};
	this.parentElement = parentElement;
	this.nbAddedOverlays = 0;

	try {
		// Create the canvas element
		var canvas = document.createElement('canvas');
		canvas.id = "map";
		canvas.width = parentElement.clientWidth;
		canvas.height = parentElement.clientHeight;
		parentElement.appendChild(canvas);
		this.canvas = canvas;

		// Create element to show attributions
		var attributions = document.createElement('div');
		attributions.id = "attributions";
		attributions.className = "olControlAttribution"; // Use existing openlayers CSS rules
		parentElement.appendChild(attributions)
		this.attributions = attributions;

		// Create the globe
		var globe = new GlobWeb.Globe({
			canvas: canvas,
			tileErrorTreshold: Configuration.get('map.globweb.tileErrorTreshold', 2),
			continuousRendering: Configuration.get('map.globweb.continuousRendering', false)
		});

		// Add attribution handler
		new GlobWeb.AttributionHandler(globe, {
			element: 'attributions'
		});

		var elevationParams = Configuration.get('map.globweb.elevationLayer');
		if (elevationParams) {
			var elevationLayer = new GlobWeb.WCSElevationLayer(elevationParams);
			globe.setBaseElevation(elevationLayer);
		}

		// Display some stats
		if (Configuration.get('map.globweb.displayStats', false)) {
			this.stats = document.createElement('div');
			this.stats.id = "stats";
			parentElement.appendChild(this.stats);
			new GlobWeb.Stats(globe, {
				element: this.stats,
				verbose: true
			});
		}

		// Create the loading element
		this.$loading = $('<img src="../css/images/ajax-loader.gif" id="loading"></img>')
			.appendTo(parentElement);

		globe.subscribe("baseLayersReady", function() {
			$("#loading").hide();
		});

		// Add mouse navigation
		var navigation = new GlobWeb.Navigation(globe, {
			mouse: {
				zoomOnDblClick: true
			},
			zoomDuration: Configuration.get('map.globweb.zoomDuration', 500)
		});
		
		// Used for debug
		// globe.addLayer(new GlobWeb.TileWireframeLayer({outline: true}));

		this.globe = globe;
		this.navigation = navigation;
	} catch (err) {
		parentElement.removeChild(canvas);
		parentElement.removeChild(attributions);
		this.canvas = null;
		this.attributions = null;
		console.log("WebGL cannot be initialized.")
		throw 'WebGLNotFound';
	}
}

var createGWStyle = function(style) {
	var gwStyle = new GlobWeb.FeatureStyle(style);

	if (style.strokeColor) {
		gwStyle.strokeColor = GlobWeb.FeatureStyle.fromStringToColor(style.strokeColor);
	}

	return gwStyle;
};

/**
 * Add a style
 */
GlobWebMapEngine.prototype.addStyle = function(name, style) {

	var gwStyle = {};

	if (style['default']) {
		for (var x in style) {
			if (style.hasOwnProperty(x)) {
				gwStyle[x] = createGWStyle(style[x]);
			}
		}
	} else {
		gwStyle['default'] = createGWStyle(style);
	}

	this.styles[name] = gwStyle;
};

/**
 * Set the background layer
 */
GlobWebMapEngine.prototype.setBackgroundLayer = function(layer) {

	var gwLayer;

	switch (layer.type.toUpperCase()) {
		case "OSM":
			gwLayer = new GlobWeb.OSMLayer(layer);
			break;
		case "WMS":
			gwLayer = new GlobWeb.WMSLayer($.extend({
					name: layer.name,
					baseUrl: layer.baseUrl,
					projection: layer.projection,
					crossOrigin: layer.crossOrigin,
					attribution: layer.attribution
				},
				layer.params));
			break;
		case "WMTS":
			gwLayer = new GlobWeb.WMTSLayer($.extend({
					name: layer.name,
					baseUrl: layer.baseUrl,
					projection: layer.projection,
					crossOrigin: layer.crossOrigin,
					attribution: layer.attribution,
					layer: layer.params.layer,
					matrixSet: layer.params.matrixSet,
					startLevel: 0
				},
				layer.params));
			break;
		case "BING":
			gwLayer = new GlobWeb.BingLayer(layer);
			break;
	}

	if (gwLayer)
		this.globe.setBaseImagery(gwLayer);

	this.$loading.show();

	return gwLayer;
}

/**
 * Set layer visibility
 */
GlobWebMapEngine.prototype.setLayerVisible = function(gwLayer, vis) {
	gwLayer.visible(vis);
}

/**
 * Set layer index
 */
GlobWebMapEngine.prototype.setLayerIndex = function(gwLayer, index) {
	gwLayer.zIndex = index;
}

/**
 * Add a layer
 */
GlobWebMapEngine.prototype.addLayer = function(layer) {

	var gwLayer;
	switch (layer.type.toUpperCase()) {
		case "WMS":
			gwLayer = new GlobWeb.WMSLayer($.extend({
				name: layer.name,
				baseUrl: layer.baseUrl,
				crossOrigin: layer.crossOrigin
			}, layer.params));
			break;
		case "WMTS":
			var config = {
				name: layer.name,
				baseUrl: layer.baseUrl,
				style: layer.params.style,
				layer: layer.params.layer,
				format: layer.params.format,
				matrixSet: layer.params.matrixSet,
				time: layer.params.time,
				crossOrigin: layer.crossOrigin
			};
			if (layer.bbox) {
				config.geoBound = new GlobWeb.GeoBound(layer.bbox[0], layer.bbox[1], layer.bbox[2], layer.bbox[3]);
			}
			gwLayer = new GlobWeb.WMTSLayer(config);
			break;
		case "FEATURE":
		case "JSON":
		case "GEOJSON":
			gwLayer = new GlobWeb.VectorLayer({
				name: layer.name,
				visible: layer.visible
			});
			if (layer.data) {
				if (typeof layer.data == "string") {
					this.addFeature(gwLayer, JSON.parse(layer.data));
				} else {
					this.addFeature(gwLayer, layer.data);
				}
			}
			break;
		case "WFS":
		case "GEORSS":
			gwLayer = new GlobWeb.VectorLayer({
				name: layer.name,
				visible: layer.visible,
				attribution: layer.attribution,
				style: new GlobWeb.FeatureStyle({
					iconUrl: '../images/point.png',
					pointMaxSize: 40000
				})
			});
			GeojsonConverter.load(layer, $.proxy(gwLayer.addFeatureCollection, gwLayer));
			break;
		case "KML":
			gwLayer = new GlobWeb.VectorLayer(layer);
			$.get(layer.location, function(data) {
				var features = GlobWeb.KMLParser.parse(data);
				gwLayer.addFeatureCollection(features);
			});
			break;
	}

	if (gwLayer) {
		if (layer.style && this.styles.hasOwnProperty(layer.style)) {
			gwLayer.style = this.styles[layer.style]['default'];
			gwLayer.styleMap = this.styles[layer.style];
		}
		
		// NGEO-1779: Set zIndex to be always on top for overlay WMS/WMTS
		if ( layer.type.toUpperCase() == "WMS" || layer.type.toUpperCase() == "WMTS" ) {
			gwLayer.zIndex = baseZIndex + this.nbAddedOverlays;
			this.nbAddedOverlays++;
		}

		gwLayer.visible(layer.visible);
		this.globe.addLayer(gwLayer);
	}

	return gwLayer;
}

/**
 * Remove layer from the map engine
 */
GlobWebMapEngine.prototype.removeLayer = function(gwLayer) {
	this.globe.removeLayer(gwLayer);
	if ( gwLayer instanceof GlobWeb.WMTSLayer || gwLayer instanceof GlobWeb.WMSLayer ) {
		this.nbAddedOverlays--;
	}
}

/**
 * Subscribe to GlobWebMap events
 */
GlobWebMapEngine.prototype.subscribe = function(name, callback) {
	switch (name) {
		case "init":
			callback(this);
			break;
		case "navigationModified":
			this.navigation.subscribe("modified", callback);
			break;
		case "mousedown":
		case "mousemove":
		case "mouseup":
		case "click":
		case "dblclick":
			this.canvas.addEventListener(name, callback);
			break;
	}
}

/**
 * Unsubscribe to GlobWebMap events
 */
GlobWebMapEngine.prototype.unsubscribe = function(name, callback) {
	switch (name) {
		case "startNavigation":
			this.globe.unsubscribe("startNavigation", callback);
			break;
		case "endNavigation":
			this.globe.unsubscribe("endNavigation", callback);
			break;
		case "mousedown":
		case "mousemove":
		case "mouseup":
		case "click":
		case "dblclick":
			this.canvas.removeEventListener(name, callback);
			break;
	}
}

/**
 * Update the size of the map
 */
GlobWebMapEngine.prototype.updateSize = function() {
	this.canvas.width = this.parentElement.clientWidth;
	this.canvas.height = this.parentElement.clientHeight;
	this.globe.refresh();
}

/**
 * Get lon lat from pixel
 */
GlobWebMapEngine.prototype.getLonLatFromPixel = function(x, y) {
	var pt = this.globe.getLonLatFromPixel(x, y);
	if (pt) {
		// To be compliant with OpenLayers remove Z
		pt.length = 2;
	}
	return pt;
}

/**
 * Get pixel from lonlat
 */
GlobWebMapEngine.prototype.getPixelFromLonLat = function(lon, lat) {
	var pixel = this.globe.getPixelFromLonLat(lon, lat);
	return {
		x: pixel[0],
		y: pixel[1]
	};
}


/**
 * Get the current viewport extent
 */
GlobWebMapEngine.prototype.getViewportExtent = function() {
	// TODO : improve geobound
	var geoBound = this.globe.getViewportGeoBound();
	if (geoBound)
		return [geoBound.getWest(), geoBound.getSouth(), geoBound.getEast(), geoBound.getNorth()];

	return [-180, -90, 180, 90];
}

/**
 * Zoom in
 */
GlobWebMapEngine.prototype.zoomIn = function() {
	this.navigation.zoom(-2);
	this.globe.refresh();
}

/**
 * Zoom out
 */
GlobWebMapEngine.prototype.zoomOut = function() {
	this.navigation.zoom(2);
	this.globe.refresh();
}

/**
 * Zoom to the given extent
 */
GlobWebMapEngine.prototype.zoomToExtent = function(extent) {
	var lon = (extent[0] + extent[2]) * 0.5;
	var lat = (extent[1] + extent[3]) * 0.5;

	var lonInRad1 = extent[0] * Math.PI / 180;
	var lonInRad2 = extent[2] * Math.PI / 180;
	var latInRad = lat * Math.PI / 180;

	var R = 6371000;
	var x = (lonInRad2 - lonInRad1) * Math.cos(latInRad);
	var d = x * R;

	d = d / Math.cos(22.5 * Math.PI / 180);
	d = Math.min(d, R * 2);

	var geoPos = [lon, lat];
	this.navigation.zoomTo(geoPos, d, Configuration.get('map.globweb.zoomDuration', 500));
}


/**
 * Remove all features from a layer
 */
GlobWebMapEngine.prototype.removeAllFeatures = function(layer) {
	layer.removeAllFeatures();
}

/**
 * Add a feature on the map
 */
GlobWebMapEngine.prototype.addFeature = function(layer, feature) {
	var isCollection = feature.type == 'FeatureCollection';
	if (isCollection) {
		layer.addFeatureCollection(feature);
	} else {
		layer.addFeature(feature);
	}
}

/**
 * Modify the product style
 */
GlobWebMapEngine.prototype.modifyFeatureStyle = function(layer, feature, style) {
	layer.modifyFeatureStyle(feature, layer.styleMap[style]);
	this.globe.refresh();
}

/**
 * Block the navigation
 */
GlobWebMapEngine.prototype.blockNavigation = function(flag) {
	if (flag) {
		this.navigation.stop();
	} else {
		this.navigation.start();
	}
}

/**
 * Update a feature
 */
GlobWebMapEngine.prototype.updateFeature = function(layer, feature) {
	layer.removeFeature(feature);
	layer.addFeature(feature);
}

/**
 * Remove a feature
 */
GlobWebMapEngine.prototype.removeFeature = function(layer, feature) {
	layer.removeFeature(feature);
}

/**
 *  Destroy the map engine
 */
GlobWebMapEngine.prototype.destroy = function() {
	this.globe.dispose();

	this.parentElement.removeChild(this.canvas);
	this.parentElement.removeChild(this.attributions);
	if (this.stats) {
		this.parentElement.removeChild(this.stats);
	}
	this.$loading.remove();

	// Free the object
	this.globe = null;
	this.parentElement = null;
	this.canvas = null;
	this.attributions = null;
	this.navigation = null;
}

module.exports = GlobWebMapEngine;