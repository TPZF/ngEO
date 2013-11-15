

define( ['jquery', 'backbone', 'text!search/template/corrInterContent.html', 
         'jqm-datebox-calbox', 'ui/dateRangeSlider'], 
		function($, Backbone, corrInterContent_template) {

/**
 * The backbone model is DatasetSearch
 */
var CorrInterView = Backbone.View.extend({

	initialize : function(){
									
	},
	
	events :{		
	},
	
	render: function(){
		var content = _.template(corrInterContent_template, this.model, { variable: 'model' });
		this.$el.html(content);

		return this;
	}
		
});

return CorrInterView;

});