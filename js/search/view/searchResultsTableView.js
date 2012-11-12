define( ['jquery', 'backbone', 'search/model/datasetSearch', 'jquery.mobile'], 
		function($, Backbone, Map, DatasetSearch) {

//the DatasetSearch is included in order to access the pagination parameters later
	
var SearchResultsTableView = Backbone.View.extend({

	//the model is a SearchResults backbone model
	
	initialize : function(options){
		
		this.mainView = options.mainView;
		this.searchResultsView = options.searchResultsView;
	},
	
	events : {
		'click tr' : function(event) {
			//Don't select the header 
			if($(event.currentTarget).hasClass('even') || $(event.currentTarget).hasClass('odd')){  
	        	$(event.currentTarget).toggleClass('row_selected');
	        }
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
//		this.select = this.mainView.$el.ngeowidget('addSelect', { id: 'browseSlider', labelId :'browseSliderLabel' , labelText: 'Browse images on map : ', optionsList: [{value: 'on' , name:'On'}, {value: 'off' , name:'Off'}] });
//		this.select.find('#browseSliderLabel').removeClass("ui-slider");
//		this.select.find('#browseSliderLabel').addClass("browseLabel");
//		
		
		this.addToShopcart = this.mainView.$el.ngeowidget('addButton', { id: 'addToShopcart', name: 'Add to Shopcart' });
		var self = this;
		this.addToShopcart.click( function() {
			//TODO 
		});
		
		this.retrieveProduct = this.mainView.$el.ngeowidget('addButton', { id: 'retrieve', name: 'Retrieve Product' });
		var self = this;
		this.retrieveProduct.click( function() {
			//TODO 
		});
		
		this.newSearch = this.mainView.$el.ngeowidget('addButton', { id: 'newSearch', name: 'New Search' });
		var self = this;
		this.newSearch.click( function() {
			self.close(); 
			self.mainView.displayDatasets();
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
 	   this.mainView.$el.ngeowidget('removeButton', '#addToShopcart');
	   this.mainView.$el.ngeowidget('removeButton', '#retrieve');
	   this.mainView.$el.ngeowidget('removeButton', '#newSearch');
	   
	   this.undelegateEvents();
	   this.$el.empty();
	   
       if (this.onClose) {
          this.onClose();
       }
    }, 
    
    onClose : function() {
    },
	
});

return SearchResultsTableView;

});