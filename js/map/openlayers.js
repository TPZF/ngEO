/**
 * OpenLayers map engine
 */

define( [ "configuration", "externs/OpenLayers.ngeo" ],
 
 function(Configuration) {
  
/**
 * Constructor
 * parentElement : the parent element div for the map
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
					 new OpenLayers.Control.Attribution() ]
		,projection: new OpenLayers.Projection(Configuration.data.map.projection) //"EPSG:3857")
		,displayProjection: new OpenLayers.Projection("EPSG:4326")
		,theme:null
	});
	
	// Create the converter for GeoJSON format
	this._geoJsonFormat = new OpenLayers.Format.GeoJSON({
		externalProjection: this._map.displayProjection,
		internalProjection: this._map.projection
	});
	
	this._styles = {};
}

/**
 * Add a style
 */
OpenLayersMapEngine.prototype.addStyle = function(name,defaut,select) {
	if (select) {
		this._styles[name] = new OpenLayers.StyleMap({
			'default' : new OpenLayers.Style(defaut),
			'select' : new OpenLayers.Style(select)
		});
	}
	else {
		this._styles[name] = new OpenLayers.StyleMap({
			'default' : new OpenLayers.Style(defaut)
		});
	}
};

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
/*	case "WMTS":
		olLayer = new OpenLayers.Layer.WMTS({
			name: "TEST_SAR-WGS84-WMTS",
			url: "http://ngeo.eox.at/c/wmts/",
			layer: 'TEST_SAR',
			matrixSet: 'WGS84',
			format: 'image/png',
			style: 'default',
			isBaseLayer:false,
			resolutions:[0.70312500000000000000,0.35156250000000000000,0.17578125000000000000,0.08789062500000000000,0.04394531250000000000,0.02197265625000000000,0.01098632812500000000,0.00549316406250000000,0.00274658203125000000,0.00137329101562500000,0.00068664550781250000,0.00034332275390625000,0.00017166137695312500,0.00008583068847656250,0.00004291534423828120,0.00002145767211914060,0.00001072883605957030,0.00000536441802978516],
			zoomOffset:0,
			units:"dd",
			maxExtent: new OpenLayers.Bounds(-180.000000,-90.000000,180.000000,90.000000),
			projection: new OpenLayers.Projection("EPSG:4326".toUpperCase()),
			sphericalMercator: false
		});
		break;*/
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
		var maxExtent;
		if ( layer.bbox ) {
			maxExtent = new OpenLayers.Bounds(layer.bbox[0],layer.bbox[1],layer.bbox[2],layer.bbox[3]);
			maxExtent.transform(this._map.displayProjection, this._map.projection);
		}
		olLayer = new OpenLayers.Layer.WMS(layer.name,
					layer.baseUrl,
					layer.params, {
						maxExtent: maxExtent,
						isBaseLayer: false,
						opacity: layer.opacity || 1.0
				   });
		break;
	case "WMTS":
		olLayer = new OpenLayers.Layer.WMTS({
			name: layer.name,
			url: layer.baseUrl,
			layer: layer.params.layer,
			matrixSet: layer.params.matrixSet,
			format: layer.params.format,
			style: layer.params.style,
			isBaseLayer: false,
			zoomOffset: -1
		});
		break;
	case "GeoRSS":
		//olLayer = new OpenLayers.Layer.GeoRSS(layer.name, layer.location, { projection: "EPSG:4326" });	
		olLayer =  new OpenLayers.Layer.Vector(layer.name, {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: layer.location,
                format: new OpenLayers.Format.GeoRSS()
            }),
			projection: "EPSG:4326"
        });

		break;
	case "WFS":
		olLayer = new OpenLayers.Layer.Vector(layer.name,{
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
	case "GeoJSON":
		olLayer = new OpenLayers.Layer.Vector(layer.name, {
			projection: "EPSG:4326"
        });
	}
	
	if (olLayer) {
		if (layer.style) {
			olLayer.styleMap = this._styles[layer.style];
		}
		olLayer.setVisibility(layer.visible);
		this._map.addLayer(olLayer);
	}
	
	return olLayer;
}

/**
 * Remove layer from the map engine
 */
OpenLayersMapEngine.prototype.removeLayer = function(olLayer)
{
	this._map.removeLayer(olLayer);
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
	case "mousedown":
	case "mouseup":
		this.element.addEventListener( name, callback, true );
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
	case "mousedown":
	case "mouseup":
		this.element.removeEventListener( name, callback );
		break;
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
 * Remove all features from a layer
 */
OpenLayersMapEngine.prototype.removeAllFeatures = function(layer)
{
	layer.removeAllFeatures();
}

/**
 * Add a feature on the map
 */
OpenLayersMapEngine.prototype.addFeatureCollection = function(layer,featureCollection)
{
	var olFeatures = this._geoJsonFormat.read(featureCollection);
	layer.addFeatures( olFeatures );

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
 * Modify the feature style
 */
OpenLayersMapEngine.prototype.modifyFeatureStyle = function(layer,feature,style)
{
	layer.drawFeature( layer.getFeatureByFid(feature.id), style );
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
