/**
 * These are the model components for Shopcarts Collection handling
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){
	
	//////////////////////////////////////////////////////////////////////////////////////////////////
/** This is the backbone Model of the Shopcart element
 */
var Shopcart = Backbone.Model.extend({
	
	defaults : {
		name : "",
		isDefault : false,
		isShared: false
	},

	initialize : function(){
		// The base url to retreive the shopcarts list
		this.urlRoot = Configuration.baseServerUrl + '/shopcarts';
		
		// The shopcart content is a feature collection
		this.features = [];
		
		// The selection of the shopcart content
		this.selection = [];
	},
	
					
	// Load the shopcart content
	loadContent: function() {

		var self = this;
		$.ajax({
			url: this.url(),
			type : 'GET',
			dataType: 'json'
				
		}).done(function(data) {
			self.features = data.features;
			self.trigger("itemsAdded", data.features);
			
		}).fail(function(jqXHR, textStatus, errorThrown) {		
			  console.log("ERROR when retrieving the shopcart Content :" + textStatus + ' ' + errorThrown);
			  self.trigger('errorLoad', self.url); 
		});
	},
			
	// Select a shopcart item
	select: function(item) {
		this.selection.push(item);
		this.trigger( "selectShopcartItems", [item] );
	},
	
	// Unselect a feature
	unselect: function(item) {
		this.selection.splice( this.selection.indexOf(item), 1 );
		this.trigger( "unselectShopcartItems", [item] );
	},

	selectAll: function(){
			
		var selected = _.difference(this.features, this.selection);
		for ( var i = 0; i < selected.length; i++ ) {
			this.selection.push( selected[i] );
		}
		
		if (selected.length != 0){
			this.trigger( "selectShopcartItems", selected );
		}
	},
	
	/** unselect all the already selected shopcart items */
	unselectAll: function() {
		
		var oldSelection = [];
		//copy the selected items
		for ( var i = 0; i < this.selection.length; i++ ) {
			oldSelection.push(this.selection[i])
		}
		this.selection = []	
		if (oldSelection.length != 0){
			this.trigger( "unselectShopcartItems", oldSelection );
		}
	},

	/** submit a POST request to the server in order to add the selected 
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
		 
		  url: this.url(),
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify({'shopCartItemAdding' : itemsToAdd}),
		
		  success: function(data) {	
		  
				// Check the response
				if ( !data.shopCartItemAdding  || !_.isArray(data.shopCartItemAdding) ) {
					self.trigger('shopcart:addItemsError');  
					return;
				}

				// Process reponse to see which items have been successfully added
				var itemsAdded = [];
				var itemsAddedResponse = data.shopCartItemAdding;
				for (var i=0; i < itemsAddedResponse.length; i++) {
					  
					var indexOfProductUrls = productUrls.indexOf( itemsAddedResponse[i].product );
					if ( indexOfProductUrls >= 0 && indexOfProductUrls < features.length ) {
					
						// Clone the feature to be different from the selected one
						var feature = _.clone(features[indexOfProductUrls]);
						feature.properties = _.clone(feature.properties);
						feature.properties.shopcartItemId = itemsAddedResponse[i].id;
						
						itemsAdded.push(feature);
						self.features.push(feature);
						
					} else {
						// TODO handle error
					}
				}
			  
			  self.trigger("itemsAdded", itemsAdded);

		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			  self.trigger('addItemsError');  
		  }
		  
		});
	},
	
	/** 
	 * Helper function toe remove one item from the shopcart
	 */ 
	_removeItem: function(id) {
		for ( var i = 0; i < this.features.length; i++ ) {
			var feature = this.features[i];
			if ( feature.properties.shopcartItemId == id ) {
				// Remove it from items
				this.features.splice(i,1);
				// Remove it from selection also
				var is = this.selection.indexOf(feature);
				if ( is >= 0 ) {
					this.selection.splice(is,1);
				}
				return feature;
			}
		}
	},
	
	/** submit a delete request to the server in order to delete the selected 
	 * shopcart items.
	 */ 
	deleteSelection: function(){
		
		// Build the request body
		var itemsToRemove = [];
		for (var i=0; i< this.selection.length; i++){
			itemsToRemove.push({'shopcartId' :  this.id, 'id' : this.selection[i].properties.shopcartItemId}); 
		}	

		var self = this;
		return $.ajax({
			 
			  url: this.url() + '/items',
			  type : 'DELETE',
			  dataType: 'json',
			  contentType: 'application/json',
			  data : JSON.stringify({'shopCartItemRemoving' : itemsToRemove}),
			
			  success: function(data) {	 					

					// Check the response
					if ( !data.shopCartItemRemoving  || !_.isArray(data.shopCartItemRemoving) ) {
						self.trigger('deleteItemsError');  
						return;
					}
					
					var removedItems = [];
					for (var i=0; i < data.shopCartItemRemoving.length; i++){
						removedItems.push( self._removeItem( data.shopCartItemRemoving[i].id ) );
					}

					self.trigger("itemsDeleted", removedItems);
			  },
			  
			  error: function(jqXHR, textStatus, errorThrown) {
				  self.trigger('deleteItemsError');  
			  }
			  
		});
	},
	
	/** submit a PUT request to the server in order to update the selected 
	 * shopcart items with the given download options
	 */ 
	updateSelection: function(downloadOptions){
		var itemsToUpdate = [];
		for (var i=0; i < this.selection.length; i++){
			itemsToUpdate.push({'shopcartId' :  this.id, 
								'id' : this.selection[i].id , 
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