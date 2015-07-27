define( ['jquery', 'logger', 'backbone', 'map/map', 'map/widget/layers', 'text!account/template/wmsManagerContent.html', 'text!account/template/wmsSearchPopupContent.html'], 
		function($, Logger, Backbone, Map, LayersWiget, wmsManager_template, wmsSearchPopup_template) {

/**
 *	Private module variables
 */
var $openedPopup;

/**
 * Callback called when a layer is checked
 */
var layerCheckedCallback = function() {
	var $this = $(this);
	$this.data('layer').setVisible($this.prop('checked'));
};

/**
 *	Create WMS layer from url
 */
var createWmsLayerFromUrl = function(baseUrl) {

	var parsed = {};
	var params = baseUrl.split(/\?|\&/);

	_.each(params, function(param) {
		var kv = param.split("=");
		if ( kv.length == 2 )
			parsed[ kv[0].toUpperCase() ] = kv[1];
	});

	// TODO: Check SRS --> must be 4326 ?
	// TODO: manage name

	var wmsLayer = {
		type: parsed['SERVICE'],
		baseUrl: params[0],
		name: parsed['LAYERS'],
		params: {
			layers: parsed['LAYERS'],
			format: decodeURIComponent(parsed['FORMAT']),
			style: parsed['STYLE']
		}
	}

	return wmsLayer;
};

/**
 *	WMS Manager view
 *	Designed to manage wms overlay layers
 */
var WmsManagerView = Backbone.View.extend({
		
	events :{
		'click #searchWms' : 'searchWms',
	},

	/**
	 *	Search wms mapserver layers or specific layer
	 */
	searchWms: function(event){

		// Create dynamic popup
		$openedPopup = $(wmsSearchPopup_template).appendTo('.ui-page-active');
		$openedPopup.popup()
			.bind("popupafterclose", function(){
				$(this).remove();
			});

		$openedPopup.popup("open").trigger("create");

		var baseUrl;
		var self = this;
		// On search callback
		var onSearch = function(){
			// Just some examples
			// Mapserver
			// baseUrl = "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi";
			// baseUrl = "http://neowms.sci.gsfc.nasa.gov/wms/wms";
			// baseUrl = "http://demonstrator.telespazio.com/wmspub";

			// Specific layer
			// baseUrl = "http://demonstrator.telespazio.com/wmspub?LAYERS=GTOPO&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&FORMAT=image%2Fjpeg&SRS=EPSG%3A4326&BBOX=90,0,112.5,22.5&WIDTH=256&HEIGHT=256"

			baseUrl = $openedPopup.find("input[type='text']").val();
			if ( baseUrl != "" ) {
				$openedPopup.find(".status").hide();

				if ( baseUrl.toUpperCase().indexOf("LAYERS=") > 0 ) {
					// Single layer
					var layer = createWmsLayerFromUrl(baseUrl);
					Map.addLayer(layer);
					$openedPopup.popup("close");

				} else {
					// Capabilities
					self.exploreCapabilities(baseUrl);
				}
			} else {
				$openedPopup.find(".status").show().html("Please enter the mapserver url");
			}
		};

		// Back to mapserver search URL input view
		var onBack = function() {
			$openedPopup.find("#mapserverSearch").show().siblings().hide();
			self.centerElement($openedPopup.closest('.ui-popup-container'));
		};

		// Adds selected layers to selection
		var onAddLayers = function() {
			_.each( $openedPopup.find("input[type='checkbox']:checked"), function(checkedInput) {

				var layer = $(checkedInput).prev().data("layer");
            	var wmsLayer = {
            		type: "WMS",
            		baseUrl: baseUrl,
            		name: layer.title,
            		params: {
            			layers: layer.name
            		}
            	}
            	Map.addLayer(wmsLayer);
			} );

			$openedPopup.popup("close");
		};		

		// Define callbacks for the given buttons
		$openedPopup
			.find('a[data-icon="search"]').click(onSearch).end()
		 	.find("a[data-icon='back']").click(onBack).end()
			.find("a[data-icon='add']").click(onAddLayers);

	},

	/**
	 *	Explore capabilities of the given baseUrl
	 */
	exploreCapabilities: function(baseUrl) {

		// Show loading
		$.mobile.loading("show",{
			text: "Loading mapserver layers..",
			textVisible: true
		});

		var self = this;
		// Launch search request to explore capabilities
		var wmsCapabilitiesFormat = new OpenLayers.Format.WMSCapabilities();
		$.ajax({
	        type: "GET",
	        url: baseUrl,
	        data: {
	            SERVICE: 'WMS',
	            //VERSION: '1.1.0', // No need to negociate version, since the highest one will be returned
	            //@see http://cite.opengeospatial.org/OGCTestData/wms/1.1.1/spec/wms1.1.1.html#basic_elements.version.negotiation
	            REQUEST: 'GetCapabilities'
	        },
	        success: function(doc) {

	            var c = wmsCapabilitiesFormat.read(doc);
	            if (!c || !c.capability) {
	                $openedPopup.find(".status").show().html("Error while parsing capabilities");
	                return;
	            }

				var $fieldset = $("<fieldset data-role='controlgroup'/>");
				_.each( c.capability.layers, function(layer) {
					$("<label data-mini='true'>" + layer.title + "<input data-theme='c' type='checkbox' /></label>").appendTo($fieldset).data("layer", layer);
				});

	            $openedPopup.find("#foundLayers").show().siblings().hide().end()
	            	.find("#availableLayers").show().html($fieldset).trigger("create");

	            $openedPopup.find(".ui-controlgroup-controls").css({
					'max-height': '500px',
					'overflow-y': 'auto',
					'min-width': '600px'
				}).end();

				// Update parent position
				self.centerElement($openedPopup.closest('.ui-popup-container'));
	        },
	        error: function(r) {
	        	$openedPopup.find(".status").show().html("Error while searching on " + baseUrl);
	        },
	        complete: function() {
	        	$.mobile.loading("hide", {
					textVisible: false
				});

	        }
		});
	},

	/**
	 *	Center the given element
	 */
	centerElement: function(element) {
		$(element).css({
			'top':Math.abs((($(window).height() - $(element).outerHeight()) / 2) + $(window).scrollTop()),
			'left':Math.abs((($(window).width() - $(element).outerWidth()) / 2) + $(window).scrollLeft())
		});
	},
	
	/**
	 *	Render
	 */
	render: function(){
		
		this.$el.append(wmsManager_template);
		this.layersWidget = new LayersWiget(this.$el.find('#wmsManagerContent'));
		this.$el.trigger('create');

		return this;
	},

	/**
	 *	Refresh method to update layers visibility state
	 */
	refresh : function(){
		this.$el.empty();
		this.render();
	}
});

return WmsManagerView;

});