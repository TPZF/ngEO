define( ['jquery', 'backbone', 'configuration', 'text!search/template/downloadOptionsContent.html'], 
		function($, Backbone, Configuration, downloadOptions_template) {

var DownloadOptionsView = Backbone.View.extend({

	/** 
	 * The model is the DatasetSearch (the search model containing search parameters)
	 * The dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 *
	 * @param options
	 *		<ul>
	 *			<li>dataset : The dataset</li>
	 *			<li>includeCollapsibleHeader : Boolean indicating if the template need to add collapsible header</li>
	 *		</ul>
	 */
	id: "downloadOptionsView",
	
	initialize : function(options) {
		this.listenTo( this.model, 'change:downloadOptions', this.render );
		this.dataset = options.dataset;
		this.downloadOptions = this.model.get("downloadOptions");
		this.includeCollapsibleHeader = options.hasOwnProperty('includeCollapsibleHeader') ? options.includeCollapsibleHeader : true;
	}, 
	
	events : {
		
		//for every option modified by a select element, set in the DatasetSearch the option
		//with the selected value.
		'change select' : function(event){
			var option = {};
			//WEBC_FAT_12 Removed Download options checkbox
			//In case of one choice is in the select box, the change event is not fired so the None is added 
			//to allow changing the values.
			var name = event.currentTarget.id;
			var value = $(event.currentTarget).val();
			var attributeToUpdate = _.findWhere( this.downloadOptions[this.dataset.get("datasetId")], { "argumentName": name } );
			if ( value != "None" )
			{
				attributeToUpdate.value = value;
			}
			else
			{
				delete attributeToUpdate.value;
			}
		},
		
		// For input checkbox, ie cropProductSearhArea
		'change input': function(event) {
			var name = event.currentTarget.id;
			var isChecked = $(event.target).is(':checked');
			var attributeToUpdate = _.findWhere( this.downloadOptions[this.dataset.get("datasetId")], { "argumentName": name } );
			if (isChecked) {
				attributeToUpdate.value = true;
			} else {
				delete attributeToUpdate.value;
			}
			
		}
		
	},
	
	render: function(){

		var content = _.template(downloadOptions_template, {
			downloadOptions: this.model.get("downloadOptions")[this.dataset.get("datasetId")],
			dataset: this.dataset,
			includeCollapsibleHeader: this.includeCollapsibleHeader
		});
		this.$el.html(content);
		this.$el.trigger('create');
		return this;
	}
		
});

return DownloadOptionsView;

});
