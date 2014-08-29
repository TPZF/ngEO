define( ['jquery', 'backbone', 'configuration', 'hostedProcesses/view/hostedProcessConfigurationView', 'dataAccess/model/standingOrderDataAccessRequest',
		'text!hostedProcesses/template/hostedProcessesListContent.html', 'ui/widget'], 
		function($, Backbone, Configuration, HostedProcessConfigurationView, StandingOrderDataAccessRequest, hostedProcessesList_template) {

/**
 * This view handles the displaying of hosted processes
 */
var SelectHostedProcessView = Backbone.View.extend({

	id: "hostedProcessView",
	initialize : function(options){
		this.request = options.request;
	},
	events: {
		"click #configureHostedProcess" : function()
		{
			$("#serverMessage").empty();

			var selectedHostedProcessIndex = this.$el.find('.selected').data("value");

			var element = $('<div id="hostedProcessConfiguration">');
			element.appendTo('.ui-page-active');

			element.ngeowidget({
				title: "Product processing",
				hide: function() {
					element.remove();
				}
			});

			var hostedProcessConfigurationView = new HostedProcessConfigurationView({
				model: this.model.get('hostedProcess')[selectedHostedProcessIndex],
				el: element,
				request: this.request
			});

			hostedProcessConfigurationView.render();
			element.trigger('create');
			element.ngeowidget("show");
		},
		"click .hostedProcess" : function(event)
		{
			var $selectedHostedProcess = $(event.target).closest('.hostedProcess');

			// Set hostedProcessId and reinit parameters
			var selectedHostedProcessIndex = $selectedHostedProcess.data("value");
			this.request.hostedProcessId = this.model.get('hostedProcess')[selectedHostedProcessIndex].hostedProcessId;
			this.request.parameters = [];

			$selectedHostedProcess
				.siblings().removeClass('selected').end()
				.toggleClass('selected');

			var configureBtn = this.$el.find('#configureHostedProcess');
			if ( this.$el.find('.selected').length > 0 )
			{
				configureBtn.removeAttr('disabled');
			}
			else
			{
				configureBtn.attr('disabled','disabled');
			}
			configureBtn.button("refresh");
		}
	},

	render : function()
	{
		var content = _.template(hostedProcessesList_template, {
			hostedProcesses: this.model.get('hostedProcess')
		});

		this.$el.html(content);

	},

	/**
	 *	Check if hosted process parameters are filled, handle EOProductURL type
	 */
	validateParameters: function()
	{
		var self = this;
		var hostedProcess = _.find(this.model.get('hostedProcess'), function(hp){ return hp.hostedProcessId == self.request.hostedProcessId; });
		for ( var i=0; i<hostedProcess.parameter.length; i++ )
		{
			var parameter = hostedProcess.parameter[i];
			var parameterFilled = _.where(this.request.parameters, {name: parameter.name}).length > 0;
			if ( parameter.type != "EOProductURL" )
			{
				if ( !parameterFilled )
					return false;
			}
			/*else
			{
				// Handle EOProductURL
				if ( !parameterFilled )
				{
					// Add EOProductParameter if doesn't exists
					var eoProductURLParameter = {
						name: parameter.name,
						value : []
					};
					
					// TODO find other way to differenciate standingOrderDataAccessRequest
					if ( this.request.url.search('standingOrderDataAccessRequest') < 0 )
					{
						// Simple or enhanced access request --> Fill EOProductURL parameter with the choosen products
						for ( var j=0; j<this.request.productURLs.length; j++ )
						{
							eoProductURLParameter.value.push( this.request.productURLs[j] );
						}
					}
					this.request.parameters.push(eoProductURLParameter);
				}
			}*/
		}

		return true;
	}
});

return SelectHostedProcessView;

});