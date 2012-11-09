define( ['jquery', 'backbone', 'search/model/datasetSearch', 'jquery.mobile'], 
		function($, Backbone, Map, DatasetSearch) {

	//the DatasetSearch is included in order to access the pagination parameters later
	
var SearchResultsTable = Backbone.View.extend({

	//the model is a SearchResults backbone model
	
	initialize : function(options){
		
		this.searchResultsView = options.searchResultsView;
		//this.model.on("change", this.render, this);

	},
	
	events : {
		'click tr' : function(event) {
	        $(event.currentTarget).toggleClass('row_selected');
	    } 
	},

	render: function(){
		
		var self = this;
		this.$el.dataTable( {
			"sDom": '<"top"i>rt<"bottom"flp><"clear">',
			"aaData" : this.model.get("itemValuesTable"),
			"aoColumns" : this.model.get("columns"),
			//"bDestroy" : true
			//"iDisplayLength": 5,
	        "bPaginate": true,
	        "bLengthChange": true,
//	        "bFilter": true,
	        "bSort": true,
//	        "bInfo": false,
//	        "bAutoWidth": false
//	        "sScrollY": "200px",
//	        "bScrollCollapse": true
	        //FIXME 
	        "fnDrawCallback": function() {
	        	self.$el.trigger('create');
	        	$("#dataTables_length").trigger('create');
	        },
	        
//	        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
//	         
//	        	$(tr).onClick($(tr).toggleClass('ui-button-active'));
//	          }
	    } );
		
		console.log(this.$el.find('tr'));
		//TODO browse slider to move 
		this.select = this.searchResultsView.$el.ngeowidget('addSelect', { id: 'browseSlider', labelId :'browseSliderLabel' , labelText: 'Browse images on map : ', optionsList: [{value: 'on' , name:'On'}, {value: 'off' , name:'Off'}] });
		this.select.find('#browseSliderLabel').removeClass("ui-slider");
		this.select.find('#browseSliderLabel').addClass("browseLabel");
		
		
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
		//this.$el.find("#datatable_next").button();//.trigger('create');
		this.$el.trigger('create');
	},	

	getSeletctedRows : function(){
		return this.$el.$('tr.row_selected');
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