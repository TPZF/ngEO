var downloadOptions_template = require('search/template/downloadOptionsContent');
var DatasetSearch = require('search/model/datasetSearch');

/** 
 * The model is the DownloadOptions
 * There is another dependency on DatasetSearch (to be resolved later...)
 * The dataset property of DatasetSearch is the Dataset backbone model containing the download options
 */
var DownloadOptionsView = Backbone.View.extend({

	id: "downloadOptionsView",

	/**
	 *	@param options
	 *		<ul>
	 *			<li>updateCallback: {Function} If defined adds "Update" button to interface. The callback must be a deffered object.</li>
	 *		</ul>
	 */
	initialize: function(options) {
		this.listenTo(DatasetSearch, 'change:downloadOptions', this.onChangeDownloadOptions);
		this.updateCallback = options.hasOwnProperty('updateCallback') ? options.updateCallback : null;
	},

	events: {

		// For every option modified by a select element
		'change select': function(event) {

			var name = event.currentTarget.id;
			var value = $(event.currentTarget).val();
			//WEBC_FAT_12 Removed Download options checkbox
   			//In case of one choice is in the select box, the change event is not fired so the None is added 
    		//to allow changing the values. --> OBSOLETE WITH NGEO-1811 .. wait for final decision about "None" to remove it
			this.model.setValue( name, value );
			var self = this;

			this.render();
		},

		// For input checkbox
		'change input': function(event) {
			var name = event.currentTarget.id;
			var isChecked = $(event.target).is(":checked");
			if ( isChecked ) {
				this.model.setValue( name, true );
			} else {
				this.model.setValue( name, null );				
			}
		},
		
		// On update "event" handler
		'click #downloadOptionsUpdate': function(event) {
			if (this.updateCallback) {
				var self = this;
				this.updateCallback().done(function() {
					self.$el.find("#downloadOptionsMessage").empty();
					self.$el.find("#downloadOptionsMessage").append("<p>Download options updated.<p>");
				});	
			} 
		}
	},

	/**
	 *	Download options has changed
	 */
	onChangeDownloadOptions: function() {
		// console.log("ON CHANGE !");
		this.render();
	},

	/**
	 *	Render
	 */
	render: function() {

		var content = downloadOptions_template({
			model: this.model,
			updateCallback: this.updateCallback != null
		});

		this.$el.html(content);

		// Grey "Update" button in case if at least one @conflict option is selected
		if ( this.$el.find('option[value="@conflict"]').is(":selected") )
		{
			this.$el.find("#downloadOptionsUpdate").attr("disabled", "disabled");
		}

		this.$el.trigger('create');
		return this;
	}

});

module.exports = DownloadOptionsView;