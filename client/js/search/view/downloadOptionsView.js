

define( ['jquery', 'backbone', 'configuration', 'text!search/template/downloadOptionsContent.html'], 
		function($, Backbone, Configuration, downloadOptions_template) {

var DownloadOptionsView = Backbone.View.extend({

	/** the model is the DatasetSearch (the search model containing search parameters)
	/* the dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 */
	
	events : {
		
		//for every option modified by a select element, set in the DatasetSearch the option
		//with the selected value.
		'change select' : function(event){
			var option = {};
			option[event.currentTarget.id] = $(event.currentTarget).val();
			this.model.set(option);			
		},

		//listen to checkbox change event since the events are handled by the check boxes label 
		'click #useDownloadOptions_label' : function(event){
			var $target = $(event.currentTarget);			
			var useDownloadOptions = $target.hasClass('ui-checkbox-off');
			this.model.set({"useDownloadOptions" : useDownloadOptions});
		}		
	},
	
	render: function(){

		var content = _.template(downloadOptions_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
		this.delegateEvents();
		return this;
	},	
	
	// TODO move to Backbone.View.prototype
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

return DownloadOptionsView;

});
