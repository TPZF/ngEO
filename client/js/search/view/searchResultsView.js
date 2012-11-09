define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'search/view/SearchResultsTable',  'text!search/template/searchResultViewContent_template.html',
         'jquery.dataTables'], 
		function($, Backbone, DatasetSearch, SearchResultsTable, searchResultsView_temp) {

var SearchResultsView = Backbone.View.extend({
	
	initialize : function(options){
		this.model.on("change", this.displayResultsTable, this);
//		this.$el.append('<div id="searchResultsHeader" data-role="header" class="ui-header ui-bar-a" role="banner"><h1 role="heading" class="ui-title" aria-level="1"> Search Results </h1></div>');
//		this 
//		this.$el.append('<div id="searchMessage"></div>');
//		this.$el.append('<div id="tableToolBar"> '+ 
//		'<div data-role="fieldcontain"> ' + 
//			'<label for="slider2" id="slider2-label" class="ui-slider">Browse images on the map</label><select name="slider2" id="slider2" data-role="slider" class="ui-slider-switch"> ' +
//					<option value="off">Off</option>
//					<option value="on">On</option>
//				</select>
//		'<div data-role="fieldcontain">' + 
//    		'<label for="search-2">Search Input:</label>' +
//    		'<input type="search" name="search-2" id="search-2" value="" />' + 
//		'</div>'  +
//		'</div>');
//		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" class="display" id="datatable"></table>');
	},

	render: function(){
		
		this.$el.append(searchResultsView_temp);
		this.$el.find("#results").hide();
		var itemsCount = this.model.get("items").length; 
		if (itemsCount == 0){
			this.$el.find("#searchMessage").append("Searching....");
		}
		this.$el.trigger("create");
		return this;
	},	

	displayResultsTable : function(){
		
		this.$el.find("#searchMessage").empty();
		this.$el.find("#results").show();
		
		var self = this;
		var searchResultsTable = new SearchResultsTable({
			el : this.$el.find("#datatable"), 
			model : this.model,
			searchResultsView : self
			});
			
		searchResultsTable.render();
	},
	
	//this.model.on("sync", this.render, this);
	// TODO move to Backbone.View.prototype
    close : function() {
    	this.$el.empty();
    	this.undelegateEvents();
       if (this.onClose) {
          this.onClose();
       }
    }, 
    
    onClose : function() {
    },
	
});

return SearchResultsView;

});