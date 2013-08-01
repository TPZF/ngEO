/**
 * These are the model components for a shopcart content handling
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){
	

	/** This is the backbone Model of the a shopcart list element */
	var ShopcartItem = Backbone.Model.extend({
		
		defaults : {
			shopcartId : "",
			product : {} //geojson feature
			//downloadOptions : {}
		},
	
		initialize : function(shopcartId){
			
			// The base url to retreive the shopcarts list
			this.urlRoot = Configuration.baseServerUrl + '/shopcarts/' + shopcartId;
			
		}
	});
	
	/** This is the backbone Collection modeling a shopcart content
	 */
	var Shopcart = Backbone.Collection.extend({
		
		model : ShopcartItem,
	
		initialize : function(id){
			
			this.id = id;
			
			//this.name = name;
			
			//table of the selected Shopcart items 
			this.selection = [];
			
			// The base url to retreive the shopcarts list
			this.url = Configuration.baseServerUrl + '/shopcarts/' + id;
		}, 
		
		/** get the items array to create the Backbone collection */ 
		parse : function(response){
			return response.items;
		},
		

		/** submit a POST request to the server in order to add the selected 
		 * products from the search results table to the shopcart.
		 * The product urls of the selected products are passed as arguments. 
		 */ 
		addItems : function(productUrls){
			
			var itemsToAdd = [];
			var self = this;
			
			//var urls = SearchResults.getProductUrls(features);
			for (var i=0; i<productUrls.length; i++){
				itemsToAdd.push({'shopcartId' : self.id, 'product' : productUrls[i]}); 
			}	

			return $.ajax({
			 
			  url: self.url,
			  type : 'POST',
			  dataType: 'json',
			  contentType: 'application/json',
			  data : JSON.stringify({'items' : itemsToAdd}),
			
			  success: function(data) {	 
				
				  var response = data.items;				  
				  self.trigger("shopcart:itemsAdded", response);
			  },
			  
			  error: function(jqXHR, textStatus, errorThrown) {
				  self.trigger('shopcart:addItemsError');  
			  }
			  
			});
		},
		
		/** submit a delete request to the server in order to delete the selected 
		 * shopcart items.
		 */ 
		removeItems : function(){
			
			var itemsToRemove = [];
			for (var i=0; i<this.selection.length; i++){
				itemsToRemove.push({'shopcartId' : shopcartId, 'id' : shopcartItems[i].id}); 
			}	

			return $.ajax({
				 
				  url: self.url + '/items',
				  type : 'DELETE',
				  dataType: 'json',
				  contentType: 'application/json',
				  data : JSON.stringify({'items' : itemsToRemove}),
				
				  success: function(data) {	 					
					  var response = data.ids;
					  self.trigger("shopcart:itemsRemoved", ids);
				  },
				  
				  error: function(jqXHR, textStatus, errorThrown) {
					  self.trigger('shopcart: deleteItemsError');  
				  }
				  
			});
		},
		
		/** submit a PUT request to the server in order to update the selected 
		 * shopcart items with the given download options
		 */ 
		updateItems : function(downloadOptions){
			
			var itemsToUpdate = [];
			for (var i=0; i<this.selection.length; i++){
				itemsToRemove.push({'shopcartId' : shopcartId, 
									'id' : shopcartItems[i].id , 
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
					  self.trigger("shopcart:itemsUpdated", response);
				  },
				  
				  error: function(jqXHR, textStatus, errorThrown) {
					  self.trigger('shopcart:updateItemsError');  

				  }
				  
			});
		}
	});

	// Add events
	_.extend(Shopcart, Backbone.Events);
	
	return Shopcart;

});

