

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
			//WEBC_FAT_12 Removed Download options checkbox
			//In case one choice is in the select box, the change event is not fired so the None is added 
			//to allow changing the values.
			var value = $(event.currentTarget).val();
			if ( value != "None" )
			{
				this.model.set( event.currentTarget.id, value );
			}
			else
			{
				this.model.unset( event.currentTarget.id );
			}
		},
		
		// For input checkbox, ie cropProductSearhArea
		'change input': function(event) {
			var value = $(event.currentTarget).val();
			this.model.set( event.currentTarget.id, value );
		}
	},
	
	render: function(){

		var content = _.template(downloadOptions_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
		return this;
	}
		
});

return DownloadOptionsView;

});
