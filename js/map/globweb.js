/**
 * GlobWeb map engine
 */

define( [ "jquery", "map/geojsonconverter", "externs/GlobWeb.min" ],

function($,GeojsonConverter) {

/**
 * Internal function to convert hex color to array of 4 flots between 0 and 1
 */
var convertColor = function(hex) {
	 var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})|([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
	 var red = parseInt(hex.length <= 4 ? result[4]+result[4] : result[1], 16);
	 var green = parseInt(hex.length <= 4 ? result[5]+result[5] : result[2], 16);
	 var blue = parseInt(hex.length <= 4 ? result[6]+result[6] : result[3], 16)
	 
	 return [ red / 255.0, green / 255.0, blue / 255.0, 1.0 ];
};


/**
 * GlobeWeb Map Engine constructor
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
				atmosphere: false,
				lighting: false,
				tileErrorTreshold: 4, 
				continuousRendering: false });
				
	
		// Create the loading element
		this.$loading = $('<img src="css/images/ajax-loader.gif" id="loading"></img>')
			.appendTo(parentElement);
			
		globe.subscribe("level0TilesLoaded", function() {
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
		this.styles[name]['default'].strokeColor = convertColor(defaut.strokeColor);
	if (select && select.strokeColor)
		this.styles[name]['select'].strokeColor = convertColor(select.strokeColor);
};

/**
 * Set the background layer
 */
GlobWebMapEngine.prototype.setBackgroundLayer = function(layer) {

	var gwLayer;
	
	switch (layer.type) {
	case "OSM":
		gwLayer = new GlobWeb.OSMLayer(layer);
		break;
	case "WMS":
		gwLayer = new GlobWeb.WMSLayer(layer);
		break;
	case "Bing":
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
	switch (layer.type) {
	case "WMS":
		gwLayer = new GlobWeb.OSMLayer(layer);
		break;
	case "GeoJSON":
		gwLayer = new GlobWeb.VectorLayer({ name: layer.name, visible: layer.visible });
		break;
	case "WFS":
	case "GeoRSS":
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
	case "click":
		$(this.mapElt).click( callback );
		break;
	case "dblclick":
		$(this.mapElt).dblclick( callback );
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
	var geoBound = this.globe.getViewportGeoBound();
	if ( geoBound )
		return [ geoBound.getWest(), geoBound.getSouth(), geoBound.getEast(), geoBound.getNorth() ];
	
	return null;
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
//	layer.removeAllFeatures();
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
 * Show the quicklook of a product
 */
GlobWebMapEngine.prototype.showQuicklook = function(product)
{
	var go = new GlobWeb.GroundOverlay( "proxy?url=" + encodeURIComponent(product.quicklookUrl), 
			product.geometry.coordinates[0], 1.0, false );
	this.globe.addGroundOverlay( go );
	this.groundOverlays[ product.name ] = go;
}

/**
 * Hide the quicklook of a product
 */
GlobWebMapEngine.prototype.hideQuicklook = function(product)
{
	var groundOverlay = this.groundOverlays.hasOwnProperty( product.name ) ? this.groundOverlays[ product.name ] : null;
	if ( groundOverlay )
	{
		this.globe.removeGroundOverlay( groundOverlay );
		delete this.groundOverlays[ product.name ];
	}
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

