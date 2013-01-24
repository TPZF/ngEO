

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults',
          'text!searchResults/template/downloadOptionsWidgetContent.html'], 
		function($, Backbone, Configuration, SearchResults, downloadOptionsWidget_template) {

var DownloadOptionsWidgetView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 */
	
	events : {
		
		//for every option modified by a select element, set in the DatasetSearch the option
		//with the selected value.
		'change select' : function(event){
			var option = {};
			var suffix = Configuration.localConfig.fieldIdSuffixSepartor + Configuration.localConfig.widgetSuffix;
			var optionName = event.currentTarget.id.substring(0, event.currentTarget.id.lastIndexOf(suffix));
			var option = {};
			option[optionName] = $(event.currentTarget).val();
			this.model.set(option);			
		},
		
		//called when the 'Update Download Options' is clicked
		'click #downloadOptionsUpdate' : function(event){
			//update the product url of the selected products with the selected download options
			//and display a message to the user.
			$.when(SearchResults.updateProductUrls(this.model.getSelectedDownloadOptions())).done(function(){
				$("#downloadOptionsMessage").empty();
				$("#downloadOptionsMessage").append("<p>Download options updated.<p>");
			});
		}
	},
		
	render: function(){

		var content = _.template(downloadOptionsWidget_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
		this.delegateEvents();
		return this;
	},	
	
    close : function() {
       this.undelegateEvents();
       this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    }, 

    onClose : function() {
    },
	
});

return DownloadOptionsWidgetView;

});
