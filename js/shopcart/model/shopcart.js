/**
 * These are the model components for Shopcarts Collection handling
 */
define( ['jquery', 'logger', 'backbone', 'configuration', 'searchResults/model/featureCollection'], 
			function($, Logger, Backbone, Configuration, FeatureCollection){
	
	
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };
  
	//////////////////////////////////////////////////////////////////////////////////////////////////
/** This is the backbone Model of the Shopcart element
 */
var Shopcart = Backbone.Model.extend({
	
	defaults : {
		name : "",
		isDefault : false
	},

	/**
		Initialize the shopcart
	 */
	initialize : function(){
		// The base url to retreive the shopcarts list
		this.urlRoot = Configuration.baseServerUrl + '/shopcarts';
		
		// The shopcart content is a feature collection
		this.featureCollection = new FeatureCollection();
	},
	
	/**
		Parse response from server
	 */
	parse: function(response) {
	
		if ( response.createShopcart && response.createShopcart.shopcart ) {
			return response.createShopcart.shopcart;
		}
		
		return response;
	},
	
	/**
		Sync model with server
	 */
	sync: function(method, model, options) {
	    var type = methodMap[method];

		// Default JSON-request options.
		var params = {type: type, dataType: 'json'};

		// Ensure that we have a URL.
		if (!options.url) {
		  params.url = _.result(model, 'url') || urlError();
		}

		// Ensure that we have the appropriate request data.
		if (options.data == null && model && (method === 'create' || method === 'update')) {
		  params.contentType = 'application/json';
		  
			var createJSON = { createShopcart: {
								shopcart: this.attributes
							}
						};
			params.data = JSON.stringify(createJSON);
		}

		// Don't process data on a non-GET request.
		if (params.type !== 'GET') {
		  params.processData = false;
		}

 		// Make the request, allowing the user to override any Ajax options.
		var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
		model.trigger('request', model, xhr, options);
		return xhr;
	},
	
					
	/**
    	Load the shopcart content
	*/
	loadContent: function() {
		this.featureCollection.search( this.url() + '/search?format=json' );
	},

	/** 
	 * Submit a POST request to the server in order to add the selected 
	 * products from the search results table to the shopcart.
	 * The product urls of the selected products are passed as arguments. 
	 */ 
	addItems: function(features) {
		
		// Build the request body
		var itemsToAdd = [];
		var productUrls = [];
		for (var i=0; i < features.length; i++) {
		
			if ( features[i].properties && features[i].properties.productUrl ) {
				itemsToAdd.push({
					shopcartId : this.id, 
					product : features[i].properties.productUrl
				});
				productUrls.push( features[i].properties.productUrl ); 
			}
		}	

		// Send the request
		var self = this;
		return $.ajax({
		 
		  url: this.url() + "/items",
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify({'shopCartItemAdding' : itemsToAdd}),
		
		  success: function(data) {	
		  
				// Check the response
				if ( !data.shopCartItemAdding  || !_.isArray(data.shopCartItemAdding) ) {
					Logger.error("Invalid response from server when adding shopcart items.");
					return;
				}

				// Process reponse to see which items have been successfully added
				var featuresAdded = [];
				var itemsAddedResponse = data.shopCartItemAdding;
				for (var i=0; i < itemsAddedResponse.length; i++) {
					  
					var indexOfProductUrls = productUrls.indexOf( itemsAddedResponse[i].product );
					if ( indexOfProductUrls >= 0 && indexOfProductUrls < features.length ) {
					
						// Clone the feature to be different from the selected one
						var feature = _.clone(features[indexOfProductUrls]);
						feature.properties = _.clone(feature.properties);
						feature.properties.shopcartItemId = itemsAddedResponse[i].id;
						
						featuresAdded.push(feature);
						
						
					} else {
						// TODO handle error
					}
				}
				
				self.featureCollection.addFeatures( featuresAdded );
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
				Logger.error("Unexpected server response when adding shopcart items (" + textStatus + " : " + errorThrown + ").");
		  }
		  
		});
	},
	
	/** 
	 * Helper function toe remove one item from the shopcart
	 */ 
	_removeItem: function(id) {
		var features = this.featureCollection.features;
		var selection = this.featureCollection.selection;
		
		for ( var i = 0; i < features.length; i++ ) {
			var feature = features[i];
			if ( feature.properties.shopcartItemId == id ) {
				// Remove it from items
				features.splice(i,1);
				// Remove it from selection also
				var is = selection.indexOf(feature);
				if ( is >= 0 ) {
					selection.splice(is,1);
				}
				return feature;
			}
		}
	},
	
	/** submit a delete request to the server in order to delete the selected 
	 * shopcart items.
	 */ 
	deleteSelection: function(){
	
		if ( this.featureCollection.selection.length == 0 ) 
			return;
		
		// Build the request body
		var itemsToRemove = [];
		for (var i=0; i< this.featureCollection.selection.length; i++) {
			var f = this.featureCollection.selection[i];
			if ( f.properties && f.properties.shopcartItemId ) {
				itemsToRemove.push({shopcartId :  this.id, id : f.properties.shopcartItemId}); 
			}
		}
		
		// Check if items are correct
		if ( itemsToRemove.length != this.featureCollection.selection.length ) {
			Logger.error("The selected shopcart items do not contain valid ID and cannot be removed.").
			return;
		}

		var self = this;
		return $.ajax({
			 
			  url: this.url() + '/items',
			  type : 'DELETE',
			  dataType: 'json',
			  contentType: 'application/json',
			  data : JSON.stringify({shopCartItemRemoving : itemsToRemove}),
			
			  success: function(data) {	 					

					// Check the response
					if ( !data.shopCartItemRemoving  || !_.isArray(data.shopCartItemRemoving) ) {
						Logger.error("Invalid response from server when removing shopcart items.");
 						return;
					}
					
					var removedItems = [];
					for (var i=0; i < data.shopCartItemRemoving.length; i++){
						removedItems.push( self._removeItem( data.shopCartItemRemoving[i].id ) );
					}
					
					// Check if items are correct
					if ( removedItems.length != itemsToRemove.length ) {
						Logger.inform( (itemsToRemove.length - removedItems.length) + " items have not been successfully removed on the server, IDs are not valid."  );
					}

					if ( removedItems.length > 0 ) {
						self.featureCollection.trigger("remove:features", removedItems);
					}
			  },
			  
			  error: function(jqXHR, textStatus, errorThrown) {
					Logger.error("Unexpected server response when removing shopcart items (" + textStatus + " : " + errorThrown + ").");
			  }
			  
		});
	},
	
	/** submit a PUT request to the server in order to update the selected 
	 * shopcart items with the given download options
	 */ 
	updateSelection: function(downloadOptions){
		var itemsToUpdate = [];
		for (var i=0; i < this.featureCollection.selection.length; i++){
			itemsToUpdate.push({'shopcartId' :  this.id, 
								'id' : this.featureCollection.selection[i].id , 
								'downloadOptions' : downloadOptions}); 
		}	

		var self = this;
		return $.ajax({
			 
			  url: self.url() + '/items',
			  type : 'PUT',
			  dataType: 'json',
			  contentType: 'application/json',
			  data : JSON.stringify({'items' : itemsToUpdate}),
			
			  success: function(data) {	 
				
				  var response = data.items;
				  self.trigger("itemsUpdated", response);
			  },
			  
			  error: function(jqXHR, textStatus, errorThrown) {
				  self.trigger('updateItemsError');  

			  }
		});
	}
});
	
return Shopcart;

});