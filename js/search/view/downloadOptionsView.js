define( ['jquery', 'backbone', 'configuration', 'text!search/template/downloadOptionsContent.html'], 
		function($, Backbone, Configuration, downloadOptions_template) {

var DownloadOptionsView = Backbone.View.extend({

	/** 
	 * The model is the DatasetSearch (the search model containing search parameters)
	 * The dataset property of DatasetSearch is the Dataset backbone model containing the download options
	 * @param options
	 *		<ul>
	 *			<li>dataset : The dataset</li>
	 *		</ul>
	 */
	id: "downloadOptionsView",

	initialize : function() {
		this.listenTo( this.model, 'change:downloadOptions', this.render );
	}, 
	
	events : {
		
		//for every option modified by a select element, set in the DatasetSearch the option
		//with the selected value.
		'change select' : function(event){
			var option = {};
			//WEBC_FAT_12 Removed Download options checkbox
			//In case of one choice is in the select box, the change event is not fired so the None is added 
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
			//check the status of the label wrapping the checkbox since
			//this label stores the checkbox status (cf jqm)
			var labelSelector  = "#" + event.currentTarget.id + "_label";
			var $targetLabel = $(labelSelector);
			var checked = $targetLabel.hasClass('ui-checkbox-on');			
			if (!checked){
				this.model.set( event.currentTarget.id, true );
			}else{
				this.model.unset( event.currentTarget.id );
			}
			
		}
		
	},
	
	render: function(){

		var content = _.template(downloadOptions_template, this.model, { variable: 'model' });
		this.$el.html(content);
		this.$el.trigger('create');
		return this;
	}
		
});

return DownloadOptionsView;

});
