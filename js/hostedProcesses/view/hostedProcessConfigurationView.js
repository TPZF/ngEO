define( ['jquery', 'backbone', 'configuration', 'text!hostedProcesses/template/hostedProcessConfigurationContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Configuration, hostedProcess_template) {

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
			// Create new properties
			var properties = []
			var selectOptions;
			this.$el.find('input, div')
				.removeClass('invalid');
			this.$el.find('select, input')
				.each(function(i){
				if ( $(this).val() )
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
				this.request['hostedProcessId'] = this.model.hostedProcessId;
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
	}
});

return HostedProcessConfigurationView;

});