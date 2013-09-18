/**
 * These are the model components for Shopcarts Collection handling
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){
	
	
	/** This is the model for a shopcart content */
	var Shopcart = function(parentModel, id){
		
		this.id = id,
		
		this.parentModel = parentModel;
			
		// The shopcart is a feature collection
		this.features = [];

		// The selection of the shopcart content
		this.selection = [];

		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts/' + id;
		
		var self = this;
		
		// fetch the shopcart content
		this.fetch = function() {

			$.ajax({
				url: self.url,
				type : 'GET',
				dataType: 'json'
					
			}).done(function(data) {
				self.features = data.features;
				self.parentModel.trigger("shopcart:loaded", self.id);
				
			}).fail(function(jqXHR, textStatus, errorThrown) {		
				  console.log("ERROR when retrieving the shopcart Content :" + textStatus + ' ' + errorThrown);
				  self.parentModel.trigger('shopcart:errorLoad', self.url); 
			});
		};
				
		// Select a shopcart item
		this.select = function(item) {
			self.selection.push(item);
			self.parentModel.trigger( "selectShopcartItems", [item] );
		};
		
		// Unselect a feature
		this.unselect = function(item) {
			self.selection.splice( self.selection.indexOf(item), 1 );
			self.parentModel.trigger( "unselectShopcartItems", [item] );
		};

		this.selectAll = function(){
				
			var selected = _.difference(self.features, self.selection);
			for ( var i = 0; i < selected.length; i++ ) {
				self.selection.push( selected[i] );
			}
			
			if (selected.length != 0){
				self.parentModel.trigger( "selectShopcartItems", selected );
			}
		};
		
		/** unselect all the already selected shopcart items */
		this.unselectAll = function() {
			
			var oldSelection = [];
			//copy the selected items
			for ( var i = 0; i < self.selection.length; i++ ) {
				oldSelection.push(self.selection[i])
			}
			self.selection = []	
			if (oldSelection.length != 0){
				self.parentModel.trigger( "unselectShopcartItems", oldSelection );
			}
		},

		/** submit a POST request to the server in order to add the selected 
		 * products from the search results table to the shopcart.
		 * The product urls of the selected products are passed as arguments. 
		 */ 
		this.addItems = function(productUrls, features){
			
			// Build the request body
			var itemsToAdd = [];
			for (var i=0; i<productUrls.length; i++){
				itemsToAdd.push({
					shopcartId : self.id, 
					product : productUrls[i]
				}); 
			}	

			// Send the request
			return $.ajax({
			 
			  url: self.url,
			  type : 'POST',
			  dataType: 'json',
			  contentType: 'application/json',
			  data : JSON.stringify({'shopCartItemAdding' : itemsToAdd}),
			
			  success: function(data) {	
			  
					// Check the response
					if ( !data.shopCartItemAdding  || !_.isArray(data.shopCartItemAdding) ) {
						self.parentModel.trigger('shopcart:addItemsError');  
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
				  
				  self.parentModel.trigger("shopcart:itemsAdded", itemsAdded);

			  },
			  
			  error: function(jqXHR, textStatus, errorThrown) {
				  self.parentModel.trigger('shopcart:addItemsError');  
			  }
			  
			});
		};
		
		/** 
		 * Helper function toe remove one item from the shopcart
		 */ 
		this._removeItem = function(id) {
			for ( var i = 0; i < this.features.length; i++ ) {
				var feature = this.features[i];
				if ( feature.properties.shopcartItemId == id ) {
					// Remove it from items
					this.features.slice(i,1);
					// Remove it from selection also
					var is = this.selection.indexOf(feature);
					if ( is >= 0 ) {
						this.selection.slice(is,1);
					}
					return feature;
				}
			}
		};
		
		/** submit a delete request to the server in order to delete the selected 
		 * shopcart items.
		 */ 
		this.deleteItems = function(){
			
			// Build the request body
			var itemsToRemove = [];
			for (var i=0; i< this.selection.length; i++){
				itemsToRemove.push({'shopcartId' :  this.id, 'id' : this.selection[i].properties.shopcartItemId}); 
			}	

			return $.ajax({
				 
				  url: self.url + '/items',
				  type : 'DELETE',
				  dataType: 'json',
				  contentType: 'application/json',
				  data : JSON.stringify({'shopCartItemRemoving' : itemsToRemove}),
				
				  success: function(data) {	 					

						// Check the response
						if ( !data.shopCartItemRemoving  || !_.isArray(data.shopCartItemRemoving) ) {
							self.parentModel.trigger('shopcart:deleteItemsError');  
							return;
						}
						
						var removedItems = [];
						for (var i=0; i < data.shopCartItemRemoving.length; i++){
							removedItems.push( self._removeItem( data.shopCartItemRemoving[i].id ) );
						}

					  	self.parentModel.trigger("shopcart:itemsDeleted", removedItems);
				  },
				  
				  error: function(jqXHR, textStatus, errorThrown) {
					  self.parentModel.trigger('shopcart: deleteItemsError');  
				  }
				  
			});
		};
		
		/** submit a PUT request to the server in order to update the selected 
		 * shopcart items with the given download options
		 */ 
		this.updateItems = function(downloadOptions){
			var itemsToUpdate = [];
			for (var i=0; i<self.selection.length; i++){
				itemsToRemove.push({'shopcartId' :  self.id, 
									'id' : self.selection[i].id , 
									'downloadOptions' : downloadOptions}); 
			}	

			return $.ajax({
				 
				  url: self.url + '/items',
				  type : 'PUT',
				  dataType: 'json',
				  contentType: 'application/json',
				  data : JSON.stringify({'items' : itemsToUpdate}),
				
				  success: function(data) {	 
					
					  var response = data.items;
					  self.parentModel.trigger("shopcart:itemsUpdated", response);
				  },
				  
				  error: function(jqXHR, textStatus, errorThrown) {
					  self.parentModel.trigger('shopcart:updateItemsError');  

				  }
			});
		};
	};
	
	//////////////////////////////////////////////////////////////////////////////////////////////////
/** This is the backbone Model of the Shopcart Collection element
 */
var ShopcartConfig = Backbone.Model.extend({
	
	defaults : {
		name : "",
		userId : "",
		isDefault : false
	},

	initialize : function(){
		// The base url to retreive the shopcarts list
		this.urlRoot = Configuration.baseServerUrl + '/shopcarts';
	}
});
	
/** This is the backbone Collection modeling the shopcart list
 */
var ShopcartCollection = Backbone.Collection.extend({
	
	model : ShopcartConfig,

	initialize : function(){
		_.extend(this, Backbone.Events);
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
		this.defaultShopcartId = "";
		this.currentShopcartId = "";
		this.currentShopcart = {};
	},

	/**
	 * Implemented in order to store at this stage the default shopcart id.
	 */
	parse : function(response){
		
		var self = this;
		for ( var i = 0; i < response.shopcarts.length; i++ ) {
			if (response.shopcarts[i].isDefault){		
				this.defaultShopcartId = response.shopcarts[i].id;
				this.currentShopcartId = this.defaultShopcartId;

			}
		}	
		return response.shopcarts;
	},
	
	/** load the current shopcart*/ 
	loadCurrentShopcart : function(){
		this.currentShopcart = new Shopcart(this, this.currentShopcartId);
		this.currentShopcart.fetch();
	},
	
	/** called when the current shopcart has been changed not after a fetch */
	updateCurrentShopcart : function(shopcartId){
		this.currentShopcartId = shopcartId;
		this.loadCurrentShopcart();
	},
	
	/** get the shopcart config of the currently selected shopcart */
	getCurrentShopcartConfig : function(){
		
		var shopcartConfig;		
		for (var i = 0; i<this.models.length; i++){
			
			if (this.models[i].id == this.currentShopcartId){
				shopcartConfig = this.models[i];
			}
		}
		 return shopcartConfig;
	},
	
	/** get the id of the shopcart before the current one ! */
	getPreviousShopcartId : function(){
		
		var shopcartId;		
		
		for (var i = 0; i<this.models.length; i++){
			
			if (this.models[i].id == this.currentShopcartId){
				if (i==0){//should not happen
					shopcartId = this.defaultShopcartId;
				}else{
					shopcartId = this.models[i-1].id;
				}
			}
		}
//		console.log("this.currentShopcartId == " + this.currentShopcartId);
//		console.log("this.defaultShopcartId == " + this.defaultShopcartId);
//		console.log("shopcartId == " + shopcartId);
		return shopcartId;
	},
	/**
	 * Get the current shopcart shared URL
	 */
	getShopcartSharedURL : function(){

		return "#data-services-area/shopcart/" +  this.currentShopcartId;

	},
	
});

return new ShopcartCollection();

});