

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults',
          'text!searchResults/template/exportViewContent.html'], 
		function($, Backbone, Configuration, SearchResults, exportViewContent_template) {

	/** TODO TO BE IMPLEMENTED */ 
var ExportView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 */
	
	events : {
		
		'click #kmlExportElt' : function(event){
			//TODO TO BE IMPLEMENTED
		},
		
		'click #xmlExportElt' : function(event){
			//TODO TO BE IMPLEMENTED	
		},
		
		'click #gmlExportElt' : function(event){
			//TODO TO BE IMPLEMENTED		
		},
		'click #okExportButton' : function(event){
			//TODO TO BE IMPLEMENTED	
		}	
	},
		
	render: function(){

		var content = _.template(exportViewContent_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
		this.delegateEvents();
		return this;
	}

});

return ExportView;

});
