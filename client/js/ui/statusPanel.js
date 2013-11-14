
define( ['jquery', 'backbone'], 
		function($, Backbone) {

/**
 * The StatusPanel manages panel for the status bar
 */
var StatusPanel = Backbone.View.extend({

	// Constructor
	initialize : function(options) {
	
		this.regionManager = null;
		this.classes = options.classes;
		this.activeStatus = null;		
	},
	
	// Only used by shared shopcart. Should be removed later?
	showTable: function() {
		this.activeStatus.tableView.show();
		this.regionManager.show(this.region,400);
		this.activeStatus.$tableCB.attr('checked',true).checkboxradio('refresh');
	},
	
	/**
	 *
	 */
	addStatus: function(status) {
	
		this.$el.append( status.tableView.$el );
		status.tableView.$el
			.hide()
			.addClass( this.classes );
			
		var self = this;
		status.$tableCB.click( function() {
		
			if ( $(this).attr('checked') ) {
				self.activeStatus.tableView.show();
				self.regionManager.show(self.region,400);
			} else {
				self.activeStatus.tableView.hide();
				self.regionManager.hide(self.region,400);				
			}
		});
	
		
		// TODO : a little ugly...
		var self = this;
		$(status.activator).click( function() {
			if ( !$(this).hasClass('toggle') ) {
			
				var isTableChecked = self.activeStatus.$tableCB.attr('checked');
				
				self.activeStatus.hide();
				status.show();
				$(self.activeStatus.activator).removeClass('toggle');
				$(this).addClass('toggle')
				
				if ( isTableChecked ) {
					status.$tableCB.attr('checked',true).checkboxradio('refresh');
					status.tableView.show();
					self.activeStatus.tableView.hide();
				} else {
					status.$tableCB.attr('checked',false).checkboxradio('refresh');
				}
				self.activeStatus = status;
			}
		});
		
		// Activate the first 'status'
		if (!this.activeStatus)	{
			this.activeStatus = status;
			status.show();
			$(this.activeStatus.activator).addClass('toggle');
		} else {
			status.hide();
		}
	}
	
});


return StatusPanel;

});