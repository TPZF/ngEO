
define( ['jquery', 'backbone'], 
		function($, Backbone) {

/**
 * The StackPanel manages a panel that contains different views, only one can be active at a time
 */
var StackPanel = Backbone.View.extend({

	// Constructor
	initialize : function(options) {
	
		this.regionManager = null;
		this.classes = options.classes;
		this.activeView = null;
		
	},
	
	add: function(view, activator) {
		this.$el.append( view.$el );
		
		view.on('sizeChanged', function() {
			this.trigger('sizeChanged');
		}, this );
		
		view.$el
			.hide()
			.addClass( this.classes );
			
		view.$activator = $(activator);
		
		var self = this;
		view.$activator.click( function() {
			self._toggle(view);
		});
	},
		
	_toggle: function(view) {
	
		if ( view == this.activeView ) {
		
			var self = this;
			this.regionManager.hide(this.region,400, function() {
				self.activeView.$el.hide();
				if (self.activeView.onHide) self.activeView.onHide();
				self.activeView = null;
			});
			view.$activator.removeClass('toggle');
			
		} else {
		
			if ( this.activeView ) {
				this.activeView.$el.hide();
				this.activeView.$activator.removeClass('toggle');
				if (this.activeView.onHide) this.activeView.onHide();
			}
			
			view.$el.show();
			if (view.onShow) view.onShow();
			view.$activator.addClass('toggle');
			
			if ( !this.activeView) {
				this.regionManager.show(this.region,400);
			}
			
			this.activeView = view;
		}
	},
	
});


return StackPanel;

});