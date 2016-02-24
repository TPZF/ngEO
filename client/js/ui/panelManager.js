/**
 * The PanelManager manages a view with different panels : left, top, center, bottom...
 */
var PanelManager = Backbone.View.extend({

	/**
		Constructor
	 */
	initialize: function(options) {

		/**
		 *	Redraw the element, used for CHROME HACK
		 */
		// jQuery.fn.redraw = function() {
		// 	return this.hide(0, function() {
		// 		$(this).show();
		// 	});
		// };

		this.$center = $(options.center);

		var self = this;
		this.centerResizedCallback = function() {
			// CHROME HACK
			// var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
			// if (isChrome) {
			// 	$('#statusBar').redraw();
			// 	if ($('#dateRangeSlider').is(':visible'))
			// 		$('#dateRangeSlider').redraw();
			// 	$('#bottomToolbar').redraw();
			// 	$('#map').redraw();
			// }
			self.trigger('centerResized');
		};
		this.leftResizedCallback = function() {
			self.trigger('leftResized');
		};

		var lazyResize = _.debounce(function() {
			self.trigger('centerResized');
			self.trigger('leftResized');
		}, 300);

		$(window).resize(lazyResize);

		this._centerState = null;
	},

	/**
		Add a panel to a region
	 */
	add: function(region, panel) {

		this[region] = panel;

		// Setup the panel
		panel.regionManager = this;
		panel.region = region;
	},

	/**
		Save the layout, and hide it
	 */
	save: function() {
		this.bottom.$el.hide();
		this.left.$el.hide();
		this._centerState = {
			bottom: this.$center.css('bottom'),
			left: this.$center.css('left')
		};
		this.$center.css({
			bottom: 0,
			left: 0
		});
		this.trigger('centerResized');
	},

	/**
		Restore the layout
	 */
	restore: function() {
		if (this._centerState) {
			this.bottom.$el.show();

			if (this.bottom.activeView && this.bottom.activeView.refresh) {
				this.bottom.activeView.refresh();
			}
			this.left.$el.show();
			this.$center.css(this._centerState);
			this.trigger('centerResized');
		}
	},

	/**
	  Called when the panel size has changed
	 */
	updatePanelSize: function(region) {
		var currentSize = this.getSize(region);
		var prevSize = this.$center.css(region);
		if (currentSize != prevSize) {
			var props = {};
			props[region] = currentSize;
			this.$center.css(props);
			this.trigger('centerResized');
			if (region == 'bottom') {
				this.left.$el.css(props);
				this.trigger('leftResized');
			}
		}
	},

	/**
		Get the size for one region
	*/
	getSize: function(region) {
		switch (region) {
			case 'left':
				return this.left.$el.outerWidth();
			case 'bottom':
				return this.bottom.$el.outerHeight();
		}
		return 0;
	},

	/**
		Show a panel
	*/
	show: function(region, duration) {
		var props = {};
		props[region] = this.getSize(region);
		this.$center.animate(props, duration, this.centerResizedCallback);

		if (region == 'bottom') {
			this.left.$el.animate(props, duration, this.leftResizedCallback);
		}

		props[region] = 0;
		this[region].$el.animate(props, duration);

		// Listen to size event on the panel
		this.listenTo(this[region], 'sizeChanged', _.bind(this.updatePanelSize, this, region));
	},

	/**
		Hide a panel
	*/
	hide: function(region, duration, callback) {
		var props = {};
		props[region] = 0;
		this.$center.animate(props, duration, this.centerResizedCallback);

		if (region == 'bottom') {
			this.left.$el.animate(props, duration, this.leftResizedCallback);
		}

		props[region] = -this.getSize(region);
		this[region].$el.animate(props, duration, callback);

		this.stopListening(this[region], 'sizeChanged');
	}

});

module.exports = PanelManager;