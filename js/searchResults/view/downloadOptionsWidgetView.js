

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
			var suffix = Configuration.data.fieldIdSuffixSepartor + Configuration.data.widgetSuffix;
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
	
	setSelectedValues : function(){

		var self = this;
		var optionSelectId;
		
		//set the selected values from the model
		_.each(this.model.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
			
			if (_.has(self.model.attributes, option.argumentName)){
				optionSelectId = "#" + option.argumentName + Configuration.data.fieldIdSuffixSepartor + Configuration.data.widgetSuffix;
				//TODO FIX THE SELECTED VALUE FOR THE SELECT
				//console.log("optionSelectId : " + optionSelectId);
				//console.log(self.model.attributes[option.argumentName]);
				//console.log(self.$el.find(optionSelectId));
				self.$el.find(optionSelectId).val(self.model.attributes[option.argumentName]);
			}
		});
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
