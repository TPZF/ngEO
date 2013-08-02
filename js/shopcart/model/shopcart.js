/**
 * These are the model components for a shopcart content handling
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){
	
	/** This is the model for a shopcart content
	 */
	var Shopcart = function(id){
		
		_.extend(this, Backbone.Events);
		
		this.id = id,
		
		this.shopcartItems = [];

		//table of the selected Shopcart items 
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
				for ( var i = 0; i < data.items.length; i++ ) {
					self.shopcartItems.push( data.items[i] );
				}
				self.trigger("shopcart:loaded");
				
			}).fail(function(jqXHR, textStatus, errorThrown) {		
				  console.log("ERROR when retrieving the shopcart Content :" + textStatus + ' ' + errorThrown);
				  self.trigger('shopcart:errorLoad', self.url); 
			});
		};
		
		// Select a shopcart item
		this.select = function(shopcartItem) {
			this.selection.push(shopcartItem);
			this.trigger( "selectShopcartItems", [shopcartItem] );
		};
		
		// Unselect a feature
		this.unselect = function(shopcartItem) {
			this.selection.splice( this.selection.indexOf(shopcartItem), 1 );
			this.trigger( "unselectShopcartItems", [shopcartItem] );
		};

		this.selectAll = function(){
				
			var selected = _.difference(this.shopcartItems, this.selection);
			for ( var i = 0; i < selected.length; i++ ) {
				this.selection.push( selected[i] );
			}
			
			if (selected.length != 0){
				this.trigger( "selectShopcartItems", selected );
			}
		};
		
		/** unselect all the already selected shopcart items */
		this.unselectAll = function() {
			
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
		this.addItems = function(productUrls){
			
			var itemsToAdd = [];

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
		};
		
		/** submit a delete request to the server in order to delete the selected 
		 * shopcart items.
		 */ 
		this.deleteItems = function(){
			
			var itemsToRemove = [];

			for (var i=0; i<this.selection.length; i++){
				itemsToRemove.push({'shopcartId' :  self.id, 'id' : this.selection[i].id}); 
			}	

			return $.ajax({
				 
				  url: self.url + '/items',
				  type : 'DELETE',
				  dataType: 'json',
				  contentType: 'application/json',
				  data : JSON.stringify({'items' : itemsToRemove}),
				
				  success: function(data) {	 					

					  var removedIndexes = [];
					  
					  for (var i=0; i<self.shopcartItems.length; i++){
						  
						  for (var j=0; j<data.ids.length; j++){
							  if (self.shopcartItems[i].id == data.ids[j].id){
								  removedIndexes.push(i);
								  self.shopcartItems.splice( i, 1 );
							  }
						  }
					  }
					  //update the selection too!!
					  for (var i=0; i<self.selection.length; i++){
						  
						  for (var j=0; j<data.ids.length; j++){
							  if (self.selection[i].id == data.ids[j].id){
								  self.selection.splice( i, 1 );
							  }
						  }
					  }
					  
					  self.trigger("shopcart:itemsDeleted", removedIndexes);
				  },
				  
				  error: function(jqXHR, textStatus, errorThrown) {
					  self.trigger('shopcart: deleteItemsError');  
				  }
				  
			});
		};
		
		/** submit a PUT request to the server in order to update the selected 
		 * shopcart items with the given download options
		 */ 
		this.updateItems = function(downloadOptions){
			
			var itemsToUpdate = [];
			for (var i=0; i<this.selection.length; i++){
				itemsToRemove.push({'shopcartId' :  self.id, 
									'id' : this.selection[i].id , 
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
		};
	};
	

return Shopcart;

});

