define( ['jquery', 'logger', 'backbone', 'map/map', 'map/widget/layers', 'text!account/template/wmsManagerContent.html', 'text!account/template/wmsSearchPopupContent.html', "highchecktree"], 
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
 *	Build highchecktree item for the given layer
 *	@param layer
 *		Could come from 3 cases:
 *			<ul>
 *				<li>WMS layer coming from configuration</li>
 *				<li>Added by user within mapserver url(coming from "wmsCapabilitiesFormat.read")</li>
 *				<li>Added by user within full wms request(coming from "createWmsLayerFromUrl")</li>
 *			</ul>
 *	@return
 *		Item object for highCheckTree plugin
 */
var buildItem = function(layer) {
	var params;
	var isConfigurationLayer = layer.engineLayer;
	if ( isConfigurationLayer ) {
		// Already created layer by conf
		params = layer.params;
	} else if ( layer.baseUrl ) {
		// WMS url added by user
		params = layer;
	} else if ( layer.name ) {
		// Layers coming from get capabilities of mapserver
		// Only layers with name attribute are accepted, otherwise it's just a group of layers
		params = {
			type: "WMS",
			name: layer.title,
			baseUrl: layer.baseUrl,
			params: {
				layers: layer.name
			}
		}
	}

	var label = params ? (params.title || params.name) : layer.title;
	return {
		item: {
			id: label,
			label: label,
			checked: isConfigurationLayer,
			layerDesc: params,
			layer: isConfigurationLayer ? layer : null
		}
	};
};

/**
 *	Creates highCheckTree structure from the given layers
 */
var buildHighCheckTreeData = function(layers) {
	var data = [];
	_.each(layers, function(layer) {
		var item = buildItem( layer );
		if (layer.nestedLayers && layer.nestedLayers.length > 0) {
			// Create children
			item.children = buildHighCheckTreeData(layer.nestedLayers);
		}
		data.push(item);
	});
	
	return data;
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

	var wmsLayer = {
		type: parsed['SERVICE'],
		baseUrl: params[0],
		name: parsed['LAYERS'],
		title: parsed['LAYERS'],
		params: {
			layers: parsed['LAYERS'],
			format: decodeURIComponent(parsed['FORMAT']),
			style: parsed['STYLE']
		}
	}

	return wmsLayer;
};

/**
 *	Add a new tree
 */
var addToTrees = function($trees, baseUrl, data) {
	// Initialize high check tree
	$('<div>').appendTo($trees).highCheckTree({
		data: data,
		onCheck: function($li) {
			var layerDesc = $li.data("layerDesc");
			if ( layerDesc ) {

				if ( !layerDesc.baseUrl ) {
					// HACK: OpenLayers capabilities format doesn't contain base url.. so use from parameter for now
					layerDesc.baseUrl = baseUrl;
				}

				// Store on $li to be able to remove later
				$li.data("layer", Map.addLayer(layerDesc) );
				
			}
		},
		onUnCheck: function($li) {
			var layer = $li.data("layer");
			if ( layer ) {
				Map.removeLayer(layer);
			}
		},
		onAddLi: function($li, node) {
			if (node.item.layerDesc) {
				$li.data("layerDesc", node.item.layerDesc);
			}
			if ( node.item.layer ) {
				$li.data("layer", node.item.layer);
			}
		},
		onDeleteLi: function($li) {
			var layer = $li.data("layer");
			if ( layer ) {
				Map.removeLayer(layer);
			}
		}
	});
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
		this.centerElement($openedPopup.closest('.ui-popup-container'));

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

			baseUrl = $openedPopup.find("input[name='wmsUrl']").val();
			if ( baseUrl != "" ) {
				$openedPopup.find(".status").hide();

				if ( baseUrl.toUpperCase().indexOf("LAYERS=") > 0 ) {
					// Single layer
					var layer = createWmsLayerFromUrl(baseUrl);
					// Override title by user defined
					layer.title = $openedPopup.find("input[name='wmsLayerName']").val();
					var item = buildItem(layer);
					addToTrees(self.$el.find("#trees"), null, [item]);

					$openedPopup.popup("close");

				} else {
					// Capabilities
					self.exploreCapabilities(baseUrl);
				}
			} else {
				$openedPopup.find(".status").show().html("Please enter the mapserver url");
			}
		};	

		// Define callbacks for the given buttons
		$openedPopup
			.find('a[data-icon="search"]').click(onSearch).end();

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

				var tree = buildHighCheckTreeData(c.capability.nestedLayers)

				addToTrees(self.$el.find("#trees"), baseUrl, [{
					item: {
						id: $openedPopup.find("input[name='wmsLayerName']").val(),
						label: $openedPopup.find("input[name='wmsLayerName']").val(),
						checked: false
					},
					children: tree
				}]);
				$openedPopup.popup("close");
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

		var data = buildHighCheckTreeData(_.filter(Map.layers, function(layer){
			return layer.params.type == "WMS";
		}));
		addToTrees( this.$el.find("#trees"), null, data );
		this.$el.trigger('create');

		return this;
	}
});

return WmsManagerView;

});