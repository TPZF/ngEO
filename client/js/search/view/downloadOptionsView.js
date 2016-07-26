var downloadOptions_template = require('search/template/downloadOptionsContent');
var DatasetSearch = require('search/model/datasetSearch');
var Configuration = require('configuration');

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
			this.model.setValue( name, value );
			var self = this;

			this.render();
		},

		// For input checkbox
		'change input': function(event) {
			var isChecked = $(event.target).is(":checked");
			var name = $(event.currentTarget).attr('name')
			var value = $(event.target).val();
			var currentValue = this.model.getAttributes()[name];
			if ( !$(event.target).data("wkt") ) {
				if ( isChecked ) {
					if ( !currentValue ) {
						currentValue = [value];
					} else {
						currentValue.push(value);
					}
				} else {
					currentValue = _.without(currentValue, value);
					if ( currentValue.length == 0 ) {
						currentValue = null;
					}
				}
				this.model.setValue( name, currentValue );
			} else {
				this.model.setValue( name, isChecked ? true : null );
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
			updateCallback: this.updateCallback != null,
			theme: Configuration.localConfig.theme
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