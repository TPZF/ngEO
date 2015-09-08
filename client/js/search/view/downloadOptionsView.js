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
		this.listenTo( this.model, 'change:downloadOptions', this.onChangeDownloadOptions );
	},
	
	events : {
		
		//for every option modified by a select element, set in the DatasetSearch the option
		//with the selected value.
		'change select' : function(event){
			var option = {};
			//WEBC_FAT_12 Removed Download options checkbox
			//In case of one choice is in the select box, the change event is not fired so the None is added 
			//to allow changing the values. --> OBSOLETE WITH NGEO-1811 .. wait for final decision about "None" to remove it
			var value = $(event.currentTarget).val();
			if ( value != "None" )
			{
				this.model.set( event.currentTarget.id, value );
			}
			else
			{
				this.model.unset( event.currentTarget.id );
			}

			var self = this;

			this.update 
			// Update model according to preconditions of each download option
			_.each(this.model.get("downloadOptions"), function(option) {
				if ( self.hasValidPreconditions( option )) {
					// cropProductSearchArea doesn't have any value
					if ( !option.cropProductSearchArea ) {
						var selectedValue = self.model.get( option.argumentName );
						if ( selectedValue ) {
							// Option has already the value set, but which doesn't respect the precondition anymore
							var valueObject = _.findWhere(option.value, { name: selectedValue });
							if ( !self.hasValidPreconditions( valueObject ) ) {
								self.model.set(option.argumentName, self.getValidValue(option).name);
							}
						} else {
							// Precondition is now respected for the given option, update model with valid value
							self.model.set(option.argumentName, self.getValidValue(option).name);
						}
					}
				} else {
					// Precondition isn't respected anymore, so we unset it from model
					self.model.unset( option.argumentName );
				}
			});
			this.render();
		},
		
		// For input checkbox, ie cropProductSearchArea
		'change input': function(event) {
			//check the status of the label wrapping the checkbox since
			//this label stores the checkbox status (cf jqm)
			var labelSelector  = "#" + event.currentTarget.id + "_label";
			var $targetLabel = $(labelSelector);
			var checked = $targetLabel.hasClass('ui-checkbox-on');			
			if (!checked) {
				this.model.set( event.currentTarget.id, true );
			} else {
				this.model.unset( event.currentTarget.id );
			}
		}
	},

	/**
	 *	Download options has changed
	 */
	onChangeDownloadOptions: function() {
		// NGEO-1811: No more "None" case, set the first value as a default one
		var self = this;
		// Update model according to new download options
		_.each(this.model.get("downloadOptions"), function(option) {
			if ( !option.cropProductSearchArea ) {
				if ( self.hasValidPreconditions( option ) ) {
					self.model.set(option.argumentName, self.getValidValue(option).name);
				}
			}
		});
		this.render();
	},

	/**
	 *	Get first valid value for the given option respecting the preconditions
	 *
	 *	@see NGEOD-729: Download options with pre-conditions
	 */
	getValidValue: function(option) {
		var self = this;

		for ( var i=0; i<option.value.length; i++ ) {
			var value = option.value[i];
			if ( self.hasValidPreconditions(value) ) {
				return value;
			}
		}
		return null;
	},

	/**
	 *	Check if option/value has valid preconditions
	 *	i.e. exist on object with the same value
	 *
	 *	@param param
	 *		Could be value in "value" array, or option in downloadOptions
	 *
	 *	@see NGEOD-729: Download options with pre-conditions
	 */
	hasValidPreconditions: function(param) {

		if ( !param.preConditions )
			return true;

		var self = this;
		var res = false;
		_.each( param.preConditions, function(precondition) {
			//console.log(model.get(precondition.parentDownloadOption) + " = " + precondition.parentDownloadValue);
			res |= (self.model.get(precondition.parentDownloadOption) == precondition.parentDownloadValue);
		} );
		return res;
	},
	
	render: function(){

		var content = _.template(downloadOptions_template, {
			model: this.model,
			hasValidPreconditions: this.hasValidPreconditions
		});

		this.$el.html(content);
		this.$el.trigger('create');
		return this;
	}
		
});

return DownloadOptionsView;

});
