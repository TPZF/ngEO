

define( ['jquery', 'backbone', 'configuration', 'shopcart/model/shopcartCollection',
          'text!shopcart/template/shopcartExportContent.html'], 
		function($, Backbone, Configuration, ShopcartCollection, exportViewContent) {
 
var ShopcartExportView = Backbone.View.extend({

	 
	
	events : {
		
		'change #shopcart-export-format' : function(event){
			var $download = this.$el.find('#download-exported-shopcart');
			var $select = $(event.currentTarget);
			
			if ( $select.val() == '' ) {
				$download.addClass('ui-disabled');
			} else {
				var format = $select.val();
				$download.removeClass('ui-disabled');
				console.log("url export :: " + ShopcartCollection.getCurrent().url() + "/" + format);
				$download.attr('href', ShopcartCollection.getCurrent().url() + "/" + format);
			}		
		},
		
	},
		
	render: function(){
		this.$el.append(exportViewContent);
		this.$el.trigger('create');
		this.$el.find('#download').addClass('ui-disabled');

		return this;
	}

});

return ShopcartExportView;

});
