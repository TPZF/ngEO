var Configuration = require('configuration');
var Map = require('map/map');

/**
 * The StatusPanel composed by statuses representing feature collection(dataset in other words)
 *
 * Each status could contain views:
 *	<ul>
 *		<li>Table view : Results table with metadata (instanciated by SearchResultsTableView)</li>
 *		<li>Gantt view : Temporal apperance of products</li>
 *	</ul>
 */
var StatusPanel = Backbone.View.extend({

	/**
	 * Constructor
	 */
	initialize: function(options) {

		this.regionManager = null;
		this.classes = options.classes;
		this.activeStatus = null;
		this.activeView = null;
		
		// When a product has been picked, select the status with the most recent product
		Map.on('pickedFeatures', function(pickedFeatures) {
			var recentFeatureCollection = null;
			var maxDate = new Date("1980-01-01");
			for ( var i=0; i<pickedFeatures.length; i++ ) {
				var feature = pickedFeatures[i];
				var currentMaxDate = new Date(Configuration.getMappedProperty(feature, "start"));
				if (maxDate < currentMaxDate){
					maxDate = currentMaxDate;
					recentFeatureCollection = feature._featureCollection.id;
				}
			}
			if ( recentFeatureCollection ) {
				$('#result' + recentFeatureCollection).click();
			}
		})
	},

	// Only used by shared shopcart. Should be removed later?
	showTable: function() {
		this.activeStatus.tableView.show();
		this.regionManager.show(this.region, 400);
		this.activeStatus.$el.find('#tableCB').prop('checked', 'checked').checkboxradio('refresh');
	},

	/**
	 * Add a view to the status panel
	 */
	addView: function(view) {
		this.$el.append(view.$el);
		view.$el
			.hide()
			.addClass(this.classes);
	},

	/**
	 * Toggle a view state between visible or not
	 */
	toggleView: function(view) {

		if (view == this.activeView) {
			var viewToHide = this.activeView;
			this.regionManager.hide(this.region, 400, function() {
				viewToHide.hide();
			});
			this.activeView = null;

		} else {
			if (this.activeView) this.activeView.hide();
			view.show();

			if (!this.activeView) {
				this.regionManager.show(this.region, 400);
			}

			this.activeView = view;
		}
	},

	/**
	 * Show a status
	 */
	showStatus: function(status) {
		// Desactivate previous status
		if (this.activeStatus) {
			this.activeStatus.$el.hide();
			$(this.activeStatus.activator).removeClass('toggle');

			// Reset the views
			for (var i = 0; i < this.activeStatus.views.length; i++) {
				this.activeStatus.views[i].setModel(null);
				this.activeStatus.viewActivators[i].prop("checked", false).checkboxradio("refresh");
			}
		}

		// Show the status
		status.$el.show();
		$(status.activator).addClass('toggle');

		// Activate model for the views
		for (var i = 0; i < status.views.length; i++) {
			status.views[i].setModel(status.model);
		}

		// Manage active view : keep an active view if there is already one
		if (this.activeView) {

			var index = status.views.indexOf(this.activeView);
			if (index >= 0) {
				status.viewActivators[index].prop("checked", true).checkboxradio("refresh");
			} else {
				this.toggleView(status.views[0]);
				status.viewActivators[0].prop("checked", true).checkboxradio("refresh");
			}
		}

		this.activeStatus = status;
	},


	/**
	 *	Add status to panel
	 */
	addStatus: function(status) {

		var self = this;

		// Link activators with views
		$.each(status.views, function(index, view) {
			status.viewActivators[index].click(function(event) {
				self.toggleView(view);

				if (!self.activeView) {
					$(this).prop("checked", false).checkboxradio("refresh");
				}
			});
		});

		// React when the activator is toggled
		$(status.activator).click(function() {
			if (!$(this).hasClass('toggle')) {
				self.showStatus(status);
			}
		});

		// Activate the first 'status'
		if (!this.activeStatus) {
			this.showStatus(status);
		} else {
			status.$el.hide();
		}
	},

	/**
	 *	Remove status from panel
	 */
	removeStatus: function(activatorId) {
		$(activatorId).remove();
	}

});


module.exports = StatusPanel;