
define( ['jquery', 'backbone'], 
		function($, Backbone) {

/**
 * The StatusPanel manages panel for the status bar
 */
var StatusPanel = Backbone.View.extend({

	// Constructor
	initialize : function(options) {
	
		this.activeView = null;
		this.regionManager = null;
		this.classes = options.classes;
		this.activeStatus = null;
		
		// TODO : tableCB should not be hardcoded
		var self = this;
		$('#tableCB').click( function() {
		
			if ( $(this).attr('checked') ) {
				self.activeStatus.tableView.show();
				self.regionManager.show(self.region,400);
			} else {
				self.activeStatus.tableView.hide();
				self.regionManager.hide(self.region,400);				
			}
		});
		
	},
	
	/**
	 *
	 */
	addStatus: function(status) {
	
		this.$el.append( status.tableView.$el );
		status.tableView.$el
			.hide()
			.addClass( this.classes );
		
		// TODO : a little ugly...
		var self = this;
		$(status.activator).click( function() {
			if ( !$(this).hasClass('toggle') ) {
				self.activeStatus.hide();
				status.show();
				$(self.activeStatus.activator).removeClass('toggle');
				$(this).addClass('toggle')
				
				if ( $('#tableCB').attr('checked') ) {
					status.tableView.show();
					self.activeStatus.tableView.hide();
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