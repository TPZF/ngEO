define( ['jquery', 'logger', 'backbone', 'configuration', 'map/map', 'userPrefs', 'text!account/template/layerManagerContent.html', 'text!account/template/layerSearchPopupContent.html', "highchecktree"], 
		function($, Logger, Backbone, Configuration, Map, UserPrefs, layerManager_template, layerSearchPopup_template) {

/**
 *	Private module variables
 */
var $openedPopup;

/**
 *	OVER UGLY METHOD to make delete action on the object for the given key=value
 */
var nestedOp = function(theObject, key, value, action) {
    var result = null;
    if(theObject instanceof Array) {
        for(var i = 0; i < theObject.length && result == null; i++) {
            result = nestedOp(theObject[i], key, value, action);
        }

        // Remove the object from the array
        if ( result && action == "delete" ) {
        	theObject.splice(i-1, 1);
        	result = false;
        }
    }
    else
    {
        for(var prop in theObject) {

            if (result != null)
                break;

            if(prop == key && theObject[prop] == value) {
				if ( action == "delete" ) {
					console.log("Deleting " + prop + ': ' + theObject[prop]);
					theObject = undefined;
					return true;
				}

				if ( action == "get" ) {
				    console.log(prop + ': ' + theObject[prop]);
				    return theObject;
				}
            }

            if(theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                result = nestedOp(theObject[prop], key, value, action);
            }
        }
    }
    return result;
}

// var findObjectById = function(root, prop, value, action) {
//     if (root.nestedLayers) {
//     	for ( var i=root.nestedLayers.length-1; i>=0; i-- ) {
//     		var nLayer = root.nestedLayers[i];
//     		for ( var key in nLayer ) {
//     			if ( key == prop && nLayer[key] == value ) {
//     				if ( action == "fetch" ) {
//     					console.log("Fetching : ");
//     					return nLayer;
//     				} else {
//     					console.log("Deleting : " + key);
//     					delete nLayer;
//     					break;
//     				}
//     			} else if ( key == "nestedLayers" ) {
//     				return findObjectById( nLayer.nestedLayers, prop, value, action );
//     			}
//     		}
//     	}
//         // for (var k in root.nestedLayers) {
//         //     if (root.nestedLayers[k][prop] == value) {
//         //         if(action=="fetch") {
//         //           return root.nestedLayers[k]; 
//         //         }
//         //         else 
//         //         {
//         //         	console.log("Deleting " + k);
//         //            delete root.nestedLayers[k];
//         //         }
//         //     }
//         //     else if (root.nestedLayers[k].nestedLayers.length) {
//         //         return findObjectById(root.nestedLayers[k], prop, value, action);
//         //     }
//         // }
//     }
// }

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
	} else if ( layer.baseUrl || layer.type == "KML" ) {
		// WMS/KML url added by user
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
 *	Add a new data to trees
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

			var parentName = $li.closest('.checktree').find(' > li').attr("rel");
			var userLayers = JSON.parse(UserPrefs.get("userLayers") || "[]");
			var parentLayer = _.findWhere(userLayers, { name: parentName });
			if ( $li.attr("rel") == parentLayer.name ) {
				userLayers.splice( userLayers.indexOf(parentLayer), 1 );
			} else {
				nestedOp(parentLayer.data, "title", $li.attr("rel"), "delete");
			}
			UserPrefs.save("userLayers", JSON.stringify(userLayers));
		}
	});
};

/**
 *	Layer manager view
 */
var LayerManagerView = Backbone.View.extend({
		
	events :{
		'click #addLayer' : 'addLayer',
	},

	/**
	 *	Add user defined layer to map
	 *	Could be: wms mapserver url, wms url of specific layer or url to KML layer
	 */
	addLayer: function(event){

		// Create dynamic popup
		$openedPopup = $(layerSearchPopup_template).appendTo('.ui-page-active');
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

			// KML
			// baseUrl = "http://quakes.bgs.ac.uk/earthquakes/recent_world_events.kml"
			baseUrl = $openedPopup.find("input[name='layerUrl']").val();

			if ( baseUrl != "" ) {

				$openedPopup.find(".status").hide();

				var name = $openedPopup.find("input[name='layerName']").val();

				if ( baseUrl.endsWith(".kml") ) {
					// KML
					var kmlDesc = {
						// Use proxy URL to avoid CORS problem
						location: Configuration.get("proxyUrl") + baseUrl,
						name: name,
						type: "KML",
						visible: true
					};
					var item = buildItem(kmlDesc);
					addToTrees(self.$el.find("#trees"), null, [item]);
					$openedPopup.popup("close");

				} else {
					// WMS
					self.addWMSLayer( name, baseUrl, {
						onError: function(message) {
							$openedPopup.find(".status").show().html(message);
						},
						onSuccess: function(layer) {
							// Update user prefereneces
							var userLayers = JSON.parse(UserPrefs.get('userLayers') || "[]");
							userLayers.push({
								name: $openedPopup.find("input[name='layerName']").val(),
								baseUrl: baseUrl,
								data: layer
							});
							
							UserPrefs.save('userLayers', JSON.stringify(userLayers));
							
							$openedPopup.popup("close");
						}
					} );
				}



			} else {
				$openedPopup.find(".status").show().html("Please enter the mapserver or KML url");
			}
		};	

		// Define callbacks for the given buttons
		$openedPopup
			.find('a[data-icon="search"]').click(onSearch).end();

	},

	/**
	 *	Add WMS layer to GUI
	 */
	addWMSLayer: function(name, baseUrl, options) {
		if ( baseUrl.toUpperCase().indexOf("LAYERS=") > 0 ) {
			// Single layer
			var layer = createWmsLayerFromUrl(baseUrl);
			// Override title by user defined
			layer.title = name;
			var item = buildItem(layer);
			addToTrees(this.$el.find("#trees"), null, [item]);

			if ( options && options.onSuccess )
				options.onSuccess(layer);

		} else {

			if ( options ) {
				// Show loading
				$.mobile.loading("show",{
					text: "Loading mapserver layers..",
					textVisible: true
				});
				options.onComplete = function() {
					$.mobile.loading("hide", {
						textVisible: false
					});
				}
			}

			// Capabilities
			this.exploreCapabilities(name, baseUrl, options);
		}
	},

	/**
	 *	Explore capabilities of the given baseUrl
	 */
	exploreCapabilities: function(name, baseUrl, options) {

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
					if ( options && options.onError )
						options.onError("Error while parsing capabilities");
					return;
				}

				var tree = buildHighCheckTreeData(c.capability.nestedLayers)

				addToTrees(self.$el.find("#trees"), baseUrl, [{
					item: {
						id: name,
						label: name,
						checked: false
					},
					children: tree
				}]);

				if ( options && options.onSuccess )
					options.onSuccess(c.capability.nestedLayers);
			},
			error: function(r) {
				if ( options && options.onError )
					options.onError("Error while searching on " + baseUrl);
			},
			complete: function() {
				if ( options && options.onComplete )
					options.onComplete();
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
	 *	Add user layers
	 *	Currently method use local storage, in long term in must be something more appropriated
	 */
	addUserLayers: function() {
		var self = this;
		var userLayers = JSON.parse(UserPrefs.get("userLayers") || "[]");
		_.each(userLayers, function(layer) {
			// Check if layer contains data coming from GetCapabilities
			if ( _.isArray(layer.data) ) {
				var tree = buildHighCheckTreeData(layer.data)

				addToTrees(self.$el.find("#trees"), layer.baseUrl, [{
					item: {
						id: layer.name,
						label: layer.name,
						checked: false
					},
					children: tree
				}]);
			} else {
				// Ordinary WMS layer
				self.addWMSLayer( layer.name, layer.baseUrl );
			}
		});
	},
	
	/**
	 *	Render
	 */
	render: function(){
		
		this.$el.append(layerManager_template);

		// Add WMS/KML layers coming from configuration to GUI
		var data = buildHighCheckTreeData(_.filter(Map.layers, function(layer){
			return layer.params.type == "WMS" || layer.params.type == "KML";
		}));
		addToTrees( this.$el.find("#trees"), null, data );

		this.addUserLayers();

		this.$el.trigger('create');

		return this;
	}
});

return LayerManagerView;

});