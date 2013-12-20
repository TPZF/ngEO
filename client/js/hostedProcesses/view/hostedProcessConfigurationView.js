define( ['jquery', 'backbone', 'configuration', 'text!hostedProcesses/template/hostedProcessConfigurationContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Configuration, hostedProcess_template) {

/**
 *	Function checking the validity of string as url
 */
var isValidURL = function(str) {
	var pattern = new RegExp(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/gi);
	if(!str.match(pattern)) {	
		return false;
	} else {
		return true;
	}
}

/**
 * This view handles the displaying the configuration of the given process
 */
var HostedProcessConfigurationView = Backbone.View.extend({

	id: "hostedProcessConfiguration",
	initialize: function(options)
	{
		this.request = options.request;
	},
	events: {
		"click #validateHostedProcessConfiguration" : function()
		{	
			this.$el.find('#validateMessage').empty();

			// Create new properties
			var properties = []
			var selectOptions;
			var self = this;
			this.$el.find('input, div')
				.removeClass('invalid');
			this.$el.find('select, input')
				.each(function(i){
				if ( self.validateField( this ) )
				{
					properties.push({
						"Name": $(this).attr("id"),
						"value": $(this).val()
					});
				}
				else
				{
					if ( $(this).data("role") == "datebox" )
					{
						$(this).parent().addClass('invalid');
					}
					else
					{
						$(this).addClass('invalid');
					}
				}
				
			});

			if ( this.$el.find('.invalid').length == 0 )
			{
				this.request['parameters'] = properties;
				$('#dataAccessPopup').ngeowidget("show");
			}
		}
	},
	render: function() {
		// Todo create Backbone.Model ? or pass by options ?
		var content = _.template(hostedProcess_template, {
			hostedProcess: this.model
		});
		this.$el.append(content);

		if ( this.$el.find('.configurationInputs').length == 0 )
		{
			this.$el.find('#validateHostedProcessConfiguration').before('<p style="text-align: center;">No parameter to configure by user</p>');
		}
	},

	/**
	 *	Check if field was filled by user and check its validity
	 */
	validateField : function( field )
	{
		var value = $(field).val();
		var isValid = true;
		if ( value )
		{
			if ( $(field).attr('type') == "number" )
			{
				var min = parseFloat( $(field).attr("min") );
				var max = parseFloat( $(field).attr("max") );
				if ( min > value || max < value )
				{
					this.$el.find('#validateMessage').append('<p style="color: red;">Value of '+ $(field).attr("id") +' field must be between '+min+' and '+max+'</p>');
					isValid = false;
				}
			}

			if ( $(field).attr('type') == "url" && !isValidURL( value ) )
			{
				this.$el.find('#validateMessage').append('<p style="color: red;">The url of '+ $(field).attr('id') +' field is not valid</p>');
				isValid = false;
			}
		}
		else
		{
			if ( this.$el.find('.missingError').length == 0 )
			{
				this.$el.find('#validateMessage').prepend('<p style="color: red;" class="missingError">Please, fill all the missing parameters</p>')
			}
			isValid = false;
		}
		return isValid;
	}
});

return HostedProcessConfigurationView;

});