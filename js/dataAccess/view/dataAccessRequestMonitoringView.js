define(
		[ 'jquery', 'backbone', 'configuration', 
		  'text!dataAccess/template/dataAccessRequestMonitoringContent.html'],
	
	function($, Backbone, Configuration, DAR_monitoring_template) {
		
		var DataAccessRequestMonitoringView = Backbone.View.extend({

			render : function() {

				var content = _.template(DAR_monitoring_template, this.model);
				this.$el.append(content);
				this.$el.trigger('create');
				
				return this;
			}

	});

	return DataAccessRequestMonitoringView;

});