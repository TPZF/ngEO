/**
 * OpenLayers map engine
 */

define( [ "externs/OpenLayers.ngeo" ],
 
 function() {
  
/**
 * Constructor
 * elementId : the element div for the map
 * initCallback : a callback to be called when the map is initialized
 */
OpenLayersMapEngine = function( parentElement )
{
	// Create element
	var elt = document.createElement('div');
	elt.id = "map";
	parentElement.appendChild(elt);
	this.element = elt;
	this.parentElement = parentElement;
	
	// Create the map
	this._map = new OpenLayers.Map(elt, {
		controls : [ new OpenLayers.Control.Navigation( { zoomWheelEnabled: true } ),
					 new OpenLayers.Control.Attribution()/*,
					 new OpenLayers.Control.LayerSwitcher()*/ ]
		,projection: new OpenLayers.Projection("EPSG:900913")
		,displayProjection: new OpenLayers.Projection("EPSG:4326")
		,units: "m"
		,maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508.34)
		,maxResolution: 156543.0339
		,minScale: 110936068.18103503
		,theme:null
	});
	
	// Create the converter for GeoJSON format
	this._geoJsonFormat = new OpenLayers.Format.GeoJSON();
}

/**
 * Set the background layer
 */
OpenLayersMapEngine.prototype.setBackgroundLayer = function(layer) {
		
	var olLayer;
	switch (layer.type) {
	case "OSM":
		olLayer = new OpenLayers.Layer.OSM(layer.name,layer.baseUrl+"/${z}/${x}/${y}.png");
		break;
	case "WMS":
		olLayer = new OpenLayers.Layer.WMS(layer.name,layer.baseUrl,layer);
		break;
	case "Bing":
		olLayer = new OpenLayers.Layer.Bing({ name: layer.name, key: layer.key, type: layer.imageSet});
		break;
	}
	
	if (olLayer) {
		this._map.addLayer(olLayer);
		this._map.setBaseLayer(olLayer);
	}
}

/**
 * Set layer visibility
 */
OpenLayersMapEngine.prototype.setLayerVisible = function(olLayer,vis) {
	olLayer.setVisibility(vis);
}

/**
 * Add a layer
 */
OpenLayersMapEngine.prototype.addLayer = function(layer) {
		
	var olLayer;
	switch (layer.type) {
	case "WMS":
		olLayer = new OpenLayers.Layer.WMS(layer.name,layer.baseUrl,layer);
		break;
	case "GeoRSS":
		olLayer = new OpenLayers.Layer.GeoRSS(layer.name, layer.location, { projection: "EPSG:4326" });
		break;
	case "KML":
		olLayer =  new OpenLayers.Layer.Vector(layer.name, {
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
		break;
	}
	
	if (olLayer) {
		olLayer.setVisibility(layer.visible);
		this._map.addLayer(olLayer);
	}
	
	return olLayer;
}


/**
 * Subscribe to OpenLayersMap events
 */
OpenLayersMapEngine.prototype.subscribe = function(name,callback)
{
	switch (name )
	{
	case "init":
		callback(this);
		break;
	case "startNavigation":
		// Attach events for navigation change
		this._map.events.register("movestart", undefined, callback);
		break;
	case "endNavigation":
		// Attach events for navigation change
		this._map.events.register("moveend", undefined, callback);
		break;
	case "click":
		$(this.element ).click( callback );
		break;
	case "dblclick":
		$(this.element ).dblclick( callback );
		break;
	}
}

/**
 * Subscribe to OpenLayersMap events
 */
OpenLayersMapEngine.prototype.unsubscribe = function(name,callback)
{
	switch (name )
	{
	case "startNavigation":
		// Detach events for navigation change
		this._map.events.unregister("movestart", undefined, callback);
		break;
	case "endNavigation":
		// Detach events for navigation change
		this._map.events.unregister("moveend", undefined, callback);
		break;
	}
}

/**
 * Set the style to be used
 */
OpenLayersMapEngine.prototype.setStyleMap = function(styleMap)
{
	this._styleMap = styleMap;
	// Create the feature layer now
	for ( var s in styleMap )
	{
		var olStyle = OpenLayers.Util.extend( {}, OpenLayers.Feature.Vector.style['default'] );
		olStyle.fill = false;
		olStyle.strokeColor = styleMap[s].strokeColor;
		olStyle.strokeWidth = styleMap[s].strokeWidth;
			
		var featureLayer = new OpenLayers.Layer.Vector(s, {
				projection: this._map.displayProjection,
				style: olStyle
			}
		);
		
		this._map.addLayer( featureLayer );
		
		styleMap[s]._featureLayer = featureLayer;
	}	
}

/**
 * Update the size of the map
 */
OpenLayersMapEngine.prototype.updateSize = function()
{
	this._map.updateSize();
}

/**
 * Get lon lat from pixel
 */
OpenLayersMapEngine.prototype.getLonLatFromPixel = function(x,y)
{
	var olLonLat = this._map.getLonLatFromPixel( new OpenLayers.Pixel(x,y) );
	olLonLat = olLonLat.transform(this._map.projection, this._map.displayProjection);
	return [ olLonLat.lon, olLonLat.lat ];
}

/**
 * Get the current viewport extent
 */
OpenLayersMapEngine.prototype.getViewportExtent = function()
{
	var boundsOrig = this._map.getExtent();
	if ( boundsOrig )
	{
		var extent = [];
		//
		var bounds = boundsOrig.transform(this._map.projection,this._map.displayProjection);
		
		var w = Math.abs(bounds.getWidth());
		var h = Math.abs(bounds.getHeight());
		extent[0] = bounds.getCenterLonLat().lon - 0.5 * w;
		extent[1] = bounds.getCenterLonLat().lat - 0.5 * h;
		extent[2] = bounds.getCenterLonLat().lon + 0.5 * w;
		extent[3] = bounds.getCenterLonLat().lat + 0.5 * h;
		return extent;
	}
	else
	{
		return null;
	}
}

/**
 * Zoom to the given extent
 */
OpenLayersMapEngine.prototype.zoomToExtent = function(extent)
{
	var bounds = new OpenLayers.Bounds(extent[0], extent[1], extent[2], extent[3]);
	bounds.transform( this._map.displayProjection, this._map.projection );
	this._map.zoomToExtent( bounds, true );
}


/**
 * Zoom in
 */
OpenLayersMapEngine.prototype.zoomIn = function()
{
	this._map.zoomIn();
}

/**
 * Zoom out
 */
OpenLayersMapEngine.prototype.zoomOut = function()
{
	this._map.zoomOut();
}

/**
 * Remove all products from the map
 */
OpenLayersMapEngine.prototype.removeAllProducts = function(style)
{
	var featureLayer = this._styleMap[style]._featureLayer;
	featureLayer.removeAllFeatures();
}

/**
 * Add a product on the map
 */
OpenLayersMapEngine.prototype.addProduct = function(product,style)
{
	var featureLayer = this._styleMap[style]._featureLayer;

	var olFeatures = this._geoJsonFormat.read(product.geometry);
	olFeatures[0].id = product.name;
	olFeatures[0].product = product;
	olFeatures[0].geometry = olFeatures[0].geometry.components[0].transform(this._map.displayProjection, this._map.projection);
	featureLayer.addFeatures( olFeatures );

}

/**
 * Remove a product from the map
 */
OpenLayersMapEngine.prototype.removeProduct = function(product)
{
	var featureLayer = this._styleMap[product.style]._featureLayer;
	var olFeature = featureLayer.getFeatureById(product.name);
	featureLayer.removeFeatures( [olFeature] );
	
	if ( product.quicklookVisible ) {
		var layers = this._map.getLayersByName( product.name );
		if ( layers )
			this._map.removeLayer( layers[0] );
	}
}

/**
 * Modify the product style
 */
OpenLayersMapEngine.prototype.modifyProductStyle = function(product,style)
{
	var origFeatureLayer = this._styleMap[product.style]._featureLayer;
	var newFeatureLayer = this._styleMap[style]._featureLayer;
	
	if ( origFeatureLayer != newFeatureLayer )
	{
		var olFeature = origFeatureLayer.getFeatureById(product.name);
		origFeatureLayer.removeFeatures( [olFeature] );
		olFeature.style = null;
		newFeatureLayer.addFeatures( [olFeature] );
	}
}

/**
 * Show the quicklook of a product
 */
OpenLayersMapEngine.prototype.showQuicklook = function(product)
{
	var olFeatures = this._geoJsonFormat.read(product.geometry);
	var productGeometry = olFeatures[0].geometry.transform(this._map.displayProjection, this._map.projection);
	
	var bounds = productGeometry.getBounds();
	var layer = new OpenLayers.Layer.Image( product.name, product.quicklookUrl, bounds, new OpenLayers.Size(512,512),
		{ isBaseLayer: false
		, alwaysInRange: true
		//, displayInLayerSwitcher: false 
		}
	);
	this._map.addLayer( layer );
}

/**
 * Hide the quicklook of the product
 */
OpenLayersMapEngine.prototype.hideQuicklook = function(product)
{
	var layers = this._map.getLayersByName( product.name );
	if ( layers )
	{
		this._map.removeLayer( layers[0] );
	}
}

/**
 * Destroy the map
 */
OpenLayersMapEngine.prototype.destroy = function()
{
	this._map.destroy();
	this.parentElement.removeChild(this.element);
}

return OpenLayersMapEngine;

});
