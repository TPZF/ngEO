/**
 * GlobWeb map engine
 */

define( [ "externs/GlobWeb.min" ],

function() {

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

GlobWebMapEngine = function( parentElement )
{
	this.groundOverlays = {};
	this.features = {};
	
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
				
		// Add mouse navigation
		var navigation = new GlobWeb.Navigation(globe);
			
		this.globe = globe;
		this.navigation = navigation;
	}
	catch (err)
	{
		this.canvas = null;
		mapElt.innerHTML = "<div style='text-align: center;'> If you see this message, WebGL is not supported in your browser.<br>\
			Please install a recent version of <a href='http://www.mozilla.com'>Firefox</a> or <a href='http://www.google.com/chrome'>Google Chrome</a>.<br>\
			If you already have a recent version of Firefox or Google Chrome, your graphics driver are too old, please update it.<br>\
			On Google Chrome, you can check why it is not working by entering 'about:gpu' in the url bar.\
		</div>";
		console.log("WebGL cannot be initialized.")
	}
}

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
		this.navigation.subscribe("start",callback);
		break;
	case "endNavigation":
		this.navigation.subscribe("end",callback);
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
		this.navigation.unsubscribe("start",callback);
		break;
	case "endNavigation":
		this.navigation.unsubscribe("end",callback);
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
	return GlobWeb.RenderContext.getLonLatFromPixel(x,y);
}


/**
 * Get the current viewport extent
 */
GlobWebMapEngine.prototype.getViewportExtent = function()
{
	if ( this.globe )
	{
		var geoBound = this.globe.getViewportGeoBound();
		if ( geoBound )
			return [ geoBound.getWest(), geoBound.getSouth(), geoBound.getEast(), geoBound.getNorth() ];
	}
	
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
 * Set the style to be used
 */
GlobWebMapEngine.prototype.setStyleMap = function(styleMap)
{
	this.styleMap = styleMap;
	// Create the feature layer now
	for ( var s in styleMap )
	{
		styleMap[s].features = {};
		styleMap[s].gwStyle = {
				color: convertColor(styleMap[s].strokeColor),
				lineWidth: styleMap[s].strokeWidth
		};
	}	
}

/**
 * Remove all products from the map
 */
GlobWebMapEngine.prototype.removeAllProducts = function(styleDesc)
{
	var style = this.styleMap[styleDesc];
	for ( var x in style.features ) {
		this.globe.removeFeature( style.features[x] );
	}
}

/**
 * Remove a product from the map
 */
GlobWebMapEngine.prototype.removeProduct = function(product)
{
	var style = this.styleMap[product.style];
	var feature = style.features[product.name];
	this.globe.removeFeature(feature);
	delete style.features[product.name];
		
	if ( product.quicklookVisible ) {
		this.hideQuicklook(product);
	}
}


/**
 * Add a product on the map
 */
GlobWebMapEngine.prototype.addProduct = function(product,style)
{
	var feature = { type: "Feature", geometry: product.geometry, id: product.name };
	this.globe.addFeature( feature, this.styleMap[style].gwStyle );
	this.styleMap[style].features[ product.name ] = feature;
}

/**
 * Modify the product style
 */
GlobWebMapEngine.prototype.modifyProductStyle = function(product,styleDesc)
{	
	var oldStyle = this.styleMap[product.style];
	var newStyle = this.styleMap[styleDesc];
	// Select the new feature
	var feature = oldStyle.features.hasOwnProperty( product.name ) ? oldStyle.features[ product.name ] : null;
	if ( feature )
	{
		this.globe.modifyFeatureStyle( feature, newStyle.gwStyle );
		delete oldStyle.features[ product.name ];
		newStyle.features[ product.name ] = feature;
	}
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
	if ( this.globe )
		this.globe.dispose();
	
	this.parentElement.removeChild(this.canvas);
	
	// Free the object
	this.globe = null;
	this.parentElement = null;
	this.canvas = null;
	this.navigation = null;	
}

return GlobWebMapEngine;

});

