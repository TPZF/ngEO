var Configuration = require('configuration');
var Map = require('map/map');
var BrowsesManager = require('searchResults/browsesManager');
var DataSetSearch = require('search/model/datasetSearch');
var Pagination = require('ui/pagination');

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
		});
		
		// Update statuses checkbox according to layer visibility
		Map.on('visibility:changed', function(layer) {
			
			if ( layer.params.type == "Browses" )
				return;

			// Very ugly method to find feature collection id from layer
			// TODO: improve !
			var fcId = layer.params.name.substr(0, layer.params.name.indexOf(" Result"));
			var selector = "#result"+fcId;
			if ( !fcId ) {
				// Shopcart special case
				fcId = layer.params.name.substr(0, layer.params.name.indexOf(" Footprint"));
				selector = "#shopcart";
			}

			if ( layer.params.visible ) {
				$(selector).find('.layerVisibility').removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
			} else {
				$(selector).find('.layerVisibility').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
			}

		});

		this.pagination = new Pagination({
			model: null,
			el: this.$el.find('#statusPagination')
		});
		this.pagination.render();

		// Need to update bottom dataset width when several dataset has been chosen to hide overflow
		var updateBottomDatasetWidth = function() {
			var menuCommandWidth = 40; // Width of first button allowing to "Show table"
			$('#bottomDatasets').width($('#bottomToolbar').outerWidth() - self.$el.find('#statusPagination').width() - menuCommandWidth);
		};
		$(window).resize(updateBottomDatasetWidth)
		this.listenTo(this.pagination, 'pagination:updated', updateBottomDatasetWidth);
	},

	// Only used by shared shopcart. Should be removed later?
	showTable: function() {
		$('#table').click();
		this.toggleView(this.activeStatus.views[0]); // Supposing that actual selected view is ShopcartTableView
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
		//status.$el.show();
		//status.views[0].$el.show();
		$(status.activator).addClass('toggle');

		// Manage active view : keep an active view if there is already one
		if (this.activeView) {

			var index = status.views.indexOf(this.activeView);
			if (index < 0) {
				this.toggleView(status.views[0]);
				this.activeView = status.views[0];
			}
		} else {
			this.toggleView(status.views[0]);
			this.activeView = status.views[0];
		}

		// Activate model for the views
		// NB: activate model after toggleView cuz element should be visible to compute width properly
		for (var i = 0; i < status.views.length; i++) {
			status.views[i].setModel(status.model);
		}
		this.pagination.setModel(status.model);

		this.activeStatus = status;
	},

	/**
	 *	Build result message
	 */
	buildResultMessage: function(features, fc) {
		var content = "";
		if ( fc.totalResults > 0 ) {
			var startIndex = 1 + (fc.currentPage - 1) * fc.countPerPage;
			var endIndex = Math.min(startIndex + fc.features.length - 1, fc.totalResults);
			content = startIndex + ' to ' + endIndex + " of " + fc.totalResults;
		} else if (fc.totalResults == 0) {
			content = 'No product found.';
		} else {
			content = 'No search done.';
		}
		return content;
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

			this.listenTo(status.model, "startLoading", function() {
				$(status.activator).find('.nbFeatures').html("Searching...").addClass("pulsating");
			});

			// Update tiny red circle with number of features on search
			this.listenTo(status.model, "add:features", function(features, fc) {
				// Use of closure for status
				$(status.activator).find('.nbFeatures').removeClass("pulsating").html(this.buildResultMessage( features, fc ));
			});

			this.listenTo(status.model, "remove:features", function(features, fc) {
				$(status.activator).find('.nbFeatures').html(this.buildResultMessage( features, fc ));
			});

			this.listenTo(status.model, 'error:features', function(searchUrl) {
				$(status.activator).find('.nbFeatures').removeClass("pulsating").html("Error on search");
			});

			this.listenTo(status.model, "reset:features", function(fc){
				// Hide it only on first search, no need for pagination searches
				if ( fc.currentPage == 0 ) {
					$(status.activator).find('.nbFeatures').html("No search done");
				}
			});

			this.listenTo(status.model, "endLoading", function(nbFeatures) {
				if (typeof nbFeatures !== undefined && nbFeatures === 0) {
					$(status.activator).find('.nbFeatures').removeClass("pulsating").html("No data to display");
				}
			});
		}

		// React when the activator is toggled
		$(status.activator).unbind('click').click(function() {
			if (!$(this).hasClass('toggle')) {
				self.showStatus(status);
				self.activeView = status.views[0];
			}
		});

		// Update footprint/browses visibility when layerVisibility checkbox is toggled
		$(status.activator).find('.layerVisibility').click(function(event) {
			event.stopPropagation();
			var _footprintLayer = status.model._footprintLayer;
			var isVisible = !_footprintLayer.params.visible;
			_footprintLayer.setVisible(isVisible);
			
			// Show/Hide browses
			var browsesLayers = BrowsesManager.getSelectedBrowseLayers(status.model);
			for ( var i=0; i<browsesLayers.length; i++ ) {
				browsesLayers[i].setVisible(isVisible);
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
	},

	setActiveView(view) {
		this.activeView = view;
	}

});


module.exports = StatusPanel;