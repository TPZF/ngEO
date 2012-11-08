define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Map, areaCriteria_template) {

var SearchResultsTable = Backbone.View.extend({

	//the model is a SearchResults backbone model
	
	initialize : function(options){
		
		this.searchResultsView = options.searchResultsView;
		//this.model.on("change", this.render, this);

	},
	
	events : {
		'click tr' : function() {
	       //TODO investigate not working
	       // $(this).toggleClass('row_selected');
	        $(this).addClass('ui-btn-active');
	        this.trigger('refresh');
	    } 
	},

	render: function(){

		this.$el.dataTable( {
			"sDom": '<"top"i>rt<"bottom"flp><"clear">',
			"aaData" : this.model.get("itemValuesTable"),
			"aoColumns" : this.model.get("columns"),
			//"bDestroy" : true
	        "bPaginate": true,
//	        "bLengthChange": false,
//	        "bFilter": true,
	        "bSort": true,
//	        "bInfo": false,
//	        "bAutoWidth": false
	    } );
		
		console.log(this.$el.find('tr'));

		
		this.addToShopcart = this.searchResultsView.$el.ngeowidget('addButton', { id: 'addToShopcart', name: 'Add to Shopcart' });
		var self = this;
		this.addToShopcart.click( function() {
			//TODO 
		});
		
		this.retrieveProduct = this.searchResultsView.$el.ngeowidget('addButton', { id: 'retrieve', name: 'Retrieve Product' });
		var self = this;
		this.retrieveProduct.click( function() {
			//TODO 
		});
		
		this.closeButton = this.searchResultsView.$el.ngeowidget('addButton', { id: 'close', name: 'Close' });
		var self = this;
		this.closeButton.click( function() {
			self.close();
		});
		// Next button is disable when no dataset is selected
		//this.addToShopcart.button('disable');
		//return this;
		//this.trigger('create');
	},	

	
	// TODO move to Backbone.View.prototype
    close : function() {
    	this.searchResultsView.$el.ngeowidget('hide');
    	this.undelegateEvents();
    	this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    }, 
    
    onClose : function() {
    },
	
});

return SearchResultsTable;

});