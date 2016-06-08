var Configuration = require('configuration');
var Map = require('map/map');
var DataSetSearch = require('search/model/datasetSearch');

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

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

		var self = this;
		// Init the dateRangeSlider singleton here
		this.dateRangeSlider = $('#dateRangeSlider').dateRangeSlider({
			bounds: {
				min: DataSetSearch.get("start"),
				max: DataSetSearch.get("stop")
			}
		});

		this.regionManager = null;
		this.classes = options.classes;
		this.bottomActivator = null;

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
					recentFeatureCollection = feature._featureCollection;
				}
			}

			// Very hacky method to click on status corresponding to picked features
			if ( recentFeatureCollection ) {
				if ( !recentFeatureCollection.dataset ) {
					// Actually shopcart doesn't have dataset, so since we have only one shopcart
					// click on shopcart
					// TODO: This issue will be resolved when multiple shopcarts could be chosen by user
					$('#shopcart').click();
				} else if ( recentFeatureCollection.id ) {
					// Otherwise the dataset containing products have been clicked
					$('#result' + recentFeatureCollection.id).click();
				}
			}
		})
	},

	// Only used by shared shopcart. Should be removed later?
	showTable: function() {
		this.activeStatus.tableView.show();
		this.regionManager.show(this.region, 400);
		this.activeStatus.$el.find('#tableCB').prop('checked', 'checked').checkboxradiosu('refresh');
	},

	/**
	 * Add a view to the status panel
	 */
	addView: function(view) {

		view.on('sizeChanged', function() {
			this.trigger('sizeChanged');
		}, this);

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
			// No more view hiding since bottom-panel is relative for now
			// var viewToHide = this.activeView;
			this.regionManager.hide(this.region, 400/*, function() {
				viewToHide.hide();
			}*/);

			this.activeView = null;

		} else {
			if (this.activeView)
				this.activeView.hide();

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
			}
		}

		// Show the status
		status.$el.show();
		$(status.activator).addClass('toggle');

		// Manage active view : keep an active view if there is already one
		if (this.activeView) {

			var index = status.views.indexOf(this.activeView);
			if (index < 0) {
				this.toggleView(status.views[0]);
				this.activeView = status.views[0];
			}
		}

		// Activate model for the views
		// NB: activate model after toggleView cuz element should be visible to compute width properly
		for (var i = 0; i < status.views.length; i++) {
			status.views[i].setModel(status.model);
		}

		this.activeStatus = status;
	},

	/**
	 *	Indicate that catalog is searching to user
	 */
	onStartLoading: function() {
		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.html("Searching...");
		$resultsMessage.addClass("pulsating")
		$resultsMessage.show();
	},

	/**
	 *	Update message on right indicating the current number of features per page
	 */
	updateResultsMessage: function(features, fc){
		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.removeClass("pulsating");
		var content = "";
		if ( fc.totalResults > 0 ) {
			var startIndex = 1 + (fc.currentPage - 1) * fc.countPerPage;
			content = 'Showing ' + startIndex + ' to ' + (startIndex + features.length - 1) + " of " + fc.totalResults + " products.";
		} else if (fc.totalResults == 0) {
			content = 'No product found.';
		} else {
			content = 'No search done.';
		}
		$resultsMessage.html(content);
	},

	/**
	 *	Add status to panel
	 */
	addStatus: function(status) {

		var self = this;

		// Link activators with views
		// $.each(status.views, function(index, view) {
		// 	console.log("Binding " + $(status.viewActivators[index]).attr("id") +" to " + view.cid);
		// 	status.viewActivators[index].unbind('click').click(function(event) {
		// 		self.toggleView(view);
		// 		$(this).toggleClass("toggle");
		// 		//self.removeClass("toggle");
		// 		// if (!self.activeView) {
		// 		// 	$(this).prop("checked", false).checkboxradio("refresh");
		// 		// }
		// 	});
		// });

		if ( status.model ) {
			this.listenTo( status.model, "startLoading", this.onStartLoading);

			// Update tiny red circle with number of features on search
			this.listenTo(status.model, "add:features", function(features, fc) {
				// Use of closure for status
				$(status.activator).find('.nbFeatures').html(fc.totalResults).show(500, function() {
					if ( $(status.activator).hasClass("toggle") ) {
						// setTimeout(function() {
							self.updateResultsMessage(features, fc);
						// }, 0);
					}
				});
			});

			this.listenTo(status.model, "remove:features", function(features, fc) {
				$(status.activator).find('.nbFeatures').html(fc.totalResults).show(500);
			});

			this.listenTo(status.model, "reset:features", function(fc){
				// Hide it only on first search, no need for pagination searches
				if ( fc.currentPage == 0 ) {
					$(status.activator).find('.nbFeatures').hide(500).html("0");
				}
			});
		}

		// React when the activator is toggled
		$(status.activator).unbind('click').click(function() {
			if (!$(this).hasClass('toggle')) {
				self.showStatus(status);
				self.activeView = status.views[0];
			}
			self.updateResultsMessage(status.model.features, status.model);
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