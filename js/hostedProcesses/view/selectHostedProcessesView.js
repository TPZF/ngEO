define( ['jquery', 'backbone', 'configuration', 'hostedProcesses/view/hostedProcessConfigurationView', 'text!hostedProcesses/template/hostedProcessesListContent.html'], 
		function($, Backbone, Configuration, HostedProcessConfigurationView, hostedProcessesList_template) {

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
				model: this.model.get('hostedProcesses')[selectedHostedProcessIndex],
				el: element,
				request: this.request
			});

			hostedProcessConfigurationView.render();
			element.trigger('create');
			element.ngeowidget("show");
		},
		"click .hostedProcess" : function(event)
		{
			// Reinitialize hostedProcessId
			if ( this.request.hostedProcessId )
			{
				this.request.hostedProcessId = null;
			}

			$(event.target).closest('.hostedProcess')
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
			hostedProcesses: this.model.get('hostedProcesses')
		});

		this.$el.append(content);

	}
});

return SelectHostedProcessView;

});