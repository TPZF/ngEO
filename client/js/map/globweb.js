/**
 * GlobWeb map engine
 */

define( [ "jquery", "map/geojsonconverter", "externs/GlobWeb.min" ],

function($,GeojsonConverter) {

/**
 * GlobeWeb Map Engine constructor
 * parentElement : the parent element div for the map
 */
GlobWebMapEngine = function( parentElement )
{
	this.groundOverlays = {};
	this.features = {};
	this.styles = {};
	this.parentElement = parentElement;
	
	try
	{
		// Create the canvas element
		var canvas = document.createElement('canvas');
		canvas.id = "map";
		canvas.width = parentElement.clientWidth;
		canvas.height = parentElement.clientHeight;
		parentElement.appendChild(canvas);
		
		this.canvas = canvas;
	
		// Create the globe
		var globe = new GlobWeb.Globe({ canvas: canvas, 
				tileErrorTreshold: 2, 
				continuousRendering: false });
				
		// Display some stats
		/*var stats = document.createElement('div');
		stats.id = "stats";
		parentElement.appendChild(stats);
		new GlobWeb.Stats(globe,{ element: stats, verbose: true });*/
		
		// Create the loading element
		this.$loading = $('<img src="css/images/ajax-loader.gif" id="loading"></img>')
			.appendTo(parentElement);
			
		globe.subscribe("baseLayersReady", function() {
			$("#loading").hide();
		});
				
		// Add mouse navigation
		var navigation = new GlobWeb.Navigation(globe);
			
		this.globe = globe;
		this.navigation = navigation;
	}
	catch (err)
	{
		parentElement.removeChild(canvas);
		this.canvas = null;
		console.log("WebGL cannot be initialized.")
		throw 'WebGLNotFound';
	}
}

/**
 * Add a style
 */
GlobWebMapEngine.prototype.addStyle = function(name,defaut,select) {
	this.styles[name] = {
		'default' : new GlobWeb.FeatureStyle(defaut),
		'select' : new GlobWeb.FeatureStyle(select)
	};
	
	// Convert color
	// TODO : do someting in GlobWeb maybe ?
	if (defaut.strokeColor)
		this.styles[name]['default'].strokeColor = GlobWeb.FeatureStyle.fromStringToColor(defaut.strokeColor);
	if (select && select.strokeColor)
		this.styles[name]['select'].strokeColor = GlobWeb.FeatureStyle.fromStringToColor(select.strokeColor);
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
		gwLayer = new GlobWeb.WMSLayer( $.extend({ name: layer.name, baseUrl: layer.baseUrl}, layer.params) );
		break;
	case "BING":
		gwLayer = new GlobWeb.BingLayer(layer);
		break;
	}
	
	if (gwLayer)
		this.globe.setBaseImagery(gwLayer);

	this.$loading.show();
}

/**
 * Set layer visibility
 */
GlobWebMapEngine.prototype.setLayerVisible = function(gwLayer,vis) {
	gwLayer.visible(vis);
}

/**
 * Add a layer
 */
GlobWebMapEngine.prototype.addLayer = function(layer) {
		
	var gwLayer;
	switch (layer.type.toUpperCase()) {
	case "WMS":
		gwLayer = new GlobWeb.WMSLayer({
			name: layer.name,
			baseUrl: layer.baseUrl,
			styles: layer.params.styles,
			layers: layer.params.layers,
			format: layer.params.format
		});
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
		};
		if ( layer.bbox ) {
			config.geoBound = new GlobWeb.GeoBound( layer.bbox[0], layer.bbox[1], layer.bbox[2], layer.bbox[3] );
		}
		gwLayer = new GlobWeb.WMTSLayer(config);
		break;
	case "GEOJSON":
		gwLayer = new GlobWeb.VectorLayer({ 
			name: layer.name, 
			visible: layer.visible 
		});
		break;
	case "WFS":
	case "GEORSS":
		gwLayer = new GlobWeb.VectorLayer({
			name: layer.name,
			visible: layer.visible,
			style: new GlobWeb.FeatureStyle({ iconUrl: 'images/hotspot.png', pointMaxSize: 40000 })
		});
		GeojsonConverter.load( layer, $.proxy(gwLayer.addFeatureCollection, gwLayer) );
		break;
	case "KML":
		gwLayer = new GlobWeb.VectorLayer(layer);
		$.get( layer.location, function(data) {
			var features = GlobWeb.KMLParser.parse(data);
			gwLayer.addFeatureCollection(features);
		});
		break;
	}
	
	if (gwLayer) {
		if ( layer.style && this.styles.hasOwnProperty(layer.style) ) {
			gwLayer.style = this.styles[layer.style]['default'];
			gwLayer.styleMap = this.styles[layer.style];
		}
		gwLayer.visible(layer.visible);
		this.globe.addLayer(gwLayer);
	}
	
	return gwLayer;
}

/**
 * Remove layer from the map engine
 */
GlobWebMapEngine.prototype.removeLayer = function(gwLayer)
{
	this.globe.removeLayer(gwLayer);
}

/**
 * Subscribe to GlobWebMap events
 */
GlobWebMapEngine.prototype.subscribe = function(name,callback)
{
	switch (name )
	{
	case "init":
		callback(this);
		break;
	case "startNavigation":
		this.globe.subscribe("startNavigation",callback);
		break;
	case "endNavigation":
		this.globe.subscribe("endNavigation",callback);
		break;
	case "mousedown":
	case "mouseup":
		this.canvas.addEventListener( name, callback );
		break;
	}
}

/**
 * Unsubscribe to GlobWebMap events
 */
GlobWebMapEngine.prototype.unsubscribe = function(name,callback)
{
	switch (name )
	{
	case "startNavigation":
		this.globe.unsubscribe("startNavigation",callback);
		break;
	case "endNavigation":
		this.globe.unsubscribe("endNavigation",callback);
		break;
	case "mousedown":
	case "mouseup":
		this.canvas.removeEventListener( name, callback );
		break;
	}
}

/**
 * Update the size of the map
 */
GlobWebMapEngine.prototype.updateSize = function()
{
	this.canvas.width = this.parentElement.clientWidth;
	this.canvas.height = this.parentElement.clientHeight;
	this.globe.refresh();
}

/**
 * Get lon lat from pixel
 */
GlobWebMapEngine.prototype.getLonLatFromPixel = function(x,y)
{
	return this.globe.getLonLatFromPixel(x,y);
}


/**
 * Get the current viewport extent
 */
GlobWebMapEngine.prototype.getViewportExtent = function()
{
	// TODO : improve geobound
	var geoBound = this.globe.getViewportGeoBound();
	if ( geoBound )
		return [ geoBound.getWest(), geoBound.getSouth(), geoBound.getEast(), geoBound.getNorth() ];
	
	return [ -180, -90, 180, 90 ];
}

/**
 * Zoom in
 */
GlobWebMapEngine.prototype.zoomIn = function()
{
	this.navigation.zoom(-2);
	this.globe.refresh();
}

/**
 * Zoom out
 */
GlobWebMapEngine.prototype.zoomOut = function()
{
	this.navigation.zoom(2);
	this.globe.refresh();
}

/**
 * Zoom to the given extent
 */
GlobWebMapEngine.prototype.zoomToExtent = function(extent)
{
	var lon = (extent[0] + extent[2]) * 0.5;
	var lat = (extent[1] + extent[3]) * 0.5;
	
	var lonInRad1 = extent[0] * Math.PI / 180;
	var lonInRad2 = extent[2] * Math.PI / 180;
	var latInRad = lat * Math.PI / 180;
		
	var R = 6371000;
	var x = (lonInRad2-lonInRad1) * Math.cos(latInRad);
	var d = x * R;
	
	d = d / Math.cos( 22.5 * Math.PI / 180 );
	d = Math.min( d, R * 2 );
	
	var geoPos = [ lon, lat ];
	this.navigation.zoomTo( geoPos, d, 5 );
}


/**
 * Remove all features from a layer
 */
GlobWebMapEngine.prototype.removeAllFeatures = function(layer)
{
	layer.removeAllFeatures();
}

/**
 * Add a feature on the map
 */
GlobWebMapEngine.prototype.addFeatureCollection = function(layer,featureCollection)
{
	layer.addFeatureCollection( featureCollection );
}

/**
 * Modify the product style
 */
GlobWebMapEngine.prototype.modifyFeatureStyle = function(layer,feature,style)
{	
	layer.modifyFeatureStyle(feature,layer.styleMap[style]);
	this.globe.refresh();
}


/**
 *  Destroy the map engine
 */
GlobWebMapEngine.prototype.destroy = function()
{
	this.globe.dispose();
	
	this.parentElement.removeChild(this.canvas);
	this.$loading.remove();
	
	// Free the object
	this.globe = null;
	this.parentElement = null;
	this.canvas = null;
	this.navigation = null;
}

return GlobWebMapEngine;

});

