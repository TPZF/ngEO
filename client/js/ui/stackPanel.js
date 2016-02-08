/**
 * The StackPanel manages a panel that contains different views, only one can be active at a time
 */

var defaultAreaView = null; // Default view with area to show
var currentAreaView = null; // View whose area is currently displayed on map

var StackPanel = Backbone.View.extend({

	// Constructor
	initialize: function(options) {

		this.regionManager = null;
		this.classes = options.classes;
		this.activeView = null;

	},

	add: function(view, activator) {
		this.$el.append(view.$el);

		view.on('sizeChanged', function() {
			this.trigger('sizeChanged');
		}, this);

		view.$el
			.hide()
			.addClass(this.classes);

		view.$activator = $(activator);

		var self = this;
		view.$activator.click(function() {
			self._toggle(view);
		});

		// Set default area view to be SearchCriteriaView for now
		if ( view.id == "datasetSearchCriteria" ) {
			defaultAreaView = view;
		}

		// Initialize current area view
		if ( view.hasOwnProperty("areaCriteriaView") ) {
			currentAreaView = view;
		}
	},

	_toggle: function(view) {

		if (view == this.activeView) {

			var self = this;
			this.regionManager.hide(this.region, 400, function() {
				self.activeView.$el.hide();
				if (self.activeView.onHide)
					self.activeView.onHide();
				self.activeView = null;

				// NGEO-1944: If view hasn't got area layer, set default one defined by defaultAreaViewId
				var currentAreaView = view.areaCriteriaView ? view : defaultAreaView;
				currentAreaView.onShow();
			});
			view.$activator.removeClass('toggle');

		} else {

			if (this.activeView) {
				this.activeView.$el.hide();
				this.activeView.$activator.removeClass('toggle');
				if (this.activeView.onHide)
					this.activeView.onHide();
			}

			// NGEO-1944: Only one area layer must be visible on map
			// Everytime set current layer visibility to false to handle the
			// case when no tab is opened but area is still on map
			currentAreaView.onHide();
			currentAreaView = view.areaCriteriaView ? view : defaultAreaView;
			currentAreaView.onShow();

			view.$el.show();
			if (view.onShow)
				view.onShow();
			view.$activator.addClass('toggle');

			if (!this.activeView) {
				this.regionManager.show(this.region, 400);
			}

			this.activeView = view;
		}
	},

});


module.exports = StackPanel;