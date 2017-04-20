var Configuration = require('configuration');
var DataSetSearch = require('search/model/datasetSearch');
var Map = require('map/map');
var Pagination = require('ui/pagination');
var tableColumnsPopup_template = require('ui/template/tableColumnsPopup');
var FeatureCollection = require('searchResults/model/featureCollection');
var SearchResultsMap = require('searchResults/map');
var MultipleBrowseWidget = require('searchResults/widget/multipleBrowseWidget');

/**
 *	Get nested objects containing the given key
 *		@param options
 *			<ul>
 *			    <li>val : Filter by value</li>
 *			    <li>firstFound : Boolean indicating if you need to return the first found object</li>
 *			<ul>
 */
var _getObjects = function(obj, key, options) {
	if ( options ) {
		var val = options.hasOwnProperty("val") ? options.val : null;
		var firstFound = options.firstFound ? options.firstFound : false;
	}

	var objects = [];
	for (var i in obj) {
		if (!obj.hasOwnProperty(i))
			continue;
		if ( i == key && (val == undefined || obj[i] == val) ) {
			if ( firstFound )
				return obj;
			objects.push(obj);
		}

		if (typeof obj[i] == 'object') {
			var foundObjects = _getObjects(obj[i], key, options);
			if ( !_.isArray(foundObjects) && firstFound ){
				return foundObjects;
			}
			else
			{
				objects = objects.concat(foundObjects);
			}
		}
	}
	return objects;
}

var _allHighlights = [];
var ctrlPressed = false;
var shiftPressed = false;
var _lastSelectedRow = null;
var _clickInTable = false; // Terrible hack to avoid scrolling to most recent feature(FIXME please..)

/**
 *	Toggle arrays helper used to splice/push features depending on their presence in prevArray
 *	Used to handle Shift+click selection
 *	Ex: newArray = [1,2,3]; prevArray = [2,3,4] --> prevArray becomes = [1,4]
 */
var toggleArrays = function(newArray, prevArray) {
  	for ( var i=0; i<newArray.length; i++ ) {
  		var item = newArray[i];
  		var idx = _.indexOf(prevArray, item);
  		if ( idx !== -1 ) {
  			prevArray.splice(idx, 1);
  		} else {
  			prevArray.push(item);
  		}
  	}
}

/**
 * A view to display a table.
 * The model contains a feature collection
 */
var TableView = Backbone.View.extend({

	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize: function(options) {

		this.setModel(this.model);

		if (options) {
			this.columnDefs = options.columnDefs;
		}

		this.hasExpandableRows = false;

		this.rowsData = [];
		this.visibleRowsData = [];
		this.feature2row = {};

		this.maxVisibleColumns = 10;
		var self = this;

		var onKeyDown = function(e) {
			if ( e.keyCode == '17' ) {
				ctrlPressed = true;
			}
			if ( e.keyCode == '16' ) {
				shiftPressed = true;
			}

			if ( ctrlPressed && e.keyCode == '65' ) {
				// Ctrl+A : select all
				e.preventDefault();

				if ( self.model )
					$(self.$el.find('.table-view-checkbox').get(0)).trigger('click');
			}
		}
		var onKeyUp = function(e) {
			if ( e.keyCode == '17' ) {
				ctrlPressed = false;
			}
			if ( e.keyCode == '16' ) {
				shiftPressed = false;
			}
		}
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		/**
		 *	This code just temporary serves to trigger highlight on ALL the feature collections
		 *	TODO: Replace the mecanism by something more sexy..
		 */
		this.triggerHighlightFeature = _.debounce(function(){
			this.highlightFeature(_allHighlights);
			_allHighlights = [];
		}, 10);
	},

	/**
	 * Manage events on the view
	 */
	events: {

		// Call when the user enter text in the filter input
		'keyup input': function(event) {
			this.filterData($(event.currentTarget).val());
		},

		'dblclick tr': function(event) {
			var data = $(event.currentTarget).data('internal');
			if (data) {
				Map.zoomToFeature(data.feature);
			}
		},

		'click .multipleBrowse': function(event) {
			var data = $(event.currentTarget).closest('tr').data('internal')
			MultipleBrowseWidget.open({
				feature: data.feature,
				featureCollection: this.model
			});
		},

		// Call when a row is clicked
		'click tr': function(event) {
			var $row = $(event.currentTarget);
			var data = $row.data('internal');
			if ( data ) {
				var fc = this.model;
				var currentHighlights;
				if ( ctrlPressed ) {
					if ( fc.highlights.indexOf(data.feature) != -1 ) {
						currentHighlights = _.without(fc.highlights, data.feature);
					} else {
						currentHighlights = fc.highlights.concat(data.feature);
					}
				} else if ( shiftPressed && _lastSelectedRow ) {
					document.getSelection().removeAllRanges();
					var range = [_lastSelectedRow, $row].sort(function(a,b) { return a.index() - b.index() } );

					var selectedRows = range[0].nextUntil(range[1]);
					selectedRows.push(event.currentTarget);
					var selectedFeatures = _.map(selectedRows, function(row) {
						return $(row).data('internal').feature;
					});
					currentHighlights = fc.highlights.slice(0);
					toggleArrays(selectedFeatures, currentHighlights);
				} else {
					currentHighlights = [data.feature];
				}
				_clickInTable = true;
				_lastSelectedRow = $row;

				if (fc.highlight && data.feature) {
					fc.highlight(currentHighlights);
				}
			}
		},

		// Call when the header is clicked : sort
		'click th': function(event) {

			var $cell = $(event.currentTarget);
			$cell.siblings("th").removeClass('sorting_asc').removeClass('sorting_desc');

			if ($cell.find('.table-view-checkbox').length > 0)
				return;

			var cellIndex = this.columnDefs.indexOf(_.find(this.columnDefs, function(c) { return c.sTitle == $cell.html(); } ));
			if ($cell.hasClass('sorting_asc')) {
				$cell.removeClass('sorting_asc');
				this.sortData(-1, 'original');
			} else if ($cell.hasClass('sorting_desc')) {
				$cell.removeClass('sorting_desc');
				$cell.addClass('sorting_asc');
				this.sortData(cellIndex, 'asc');
			} else {
				$cell.addClass('sorting_desc');
				this.sortData(cellIndex, 'desc');
			}
		},

		// Call when the expand icon is clicked
		'click .table-view-expand': function(event) {
			// Change icon and return the row
			var $row = $(event.currentTarget)
				.toggleClass('ui-icon-minus')
				.toggleClass('ui-icon-plus')
				.closest('tr');

			var rowData = $row.data('internal');
			rowData.isExpanded = !rowData.isExpanded;
			if (rowData.isExpanded) {
				this.expandRow($row);
			} else {
				this.closeRow($row);
			}
		},

		// Called when the user clicks on "browse-visibility" checkbox in table
		'click .browse-visibility-checkbox': function(event) {
			var $target = $(event.currentTarget);
			var $row = $target.closest('tr');
			var data = $row.data('internal');

			// Based on css value, show/hide browses
			if ($target.hasClass('ui-icon-checkbox-off')) {
				this.model.showBrowses( $row.hasClass('row_highlighted') ? this.model.highlights : [data.feature] );
			} else {
				this.model.hideBrowses( $row.hasClass('row_highlighted') ? this.model.highlights : [data.feature] );
			}
		},

		// Called when the user clicks on the "selection" checkbox in table
		'click .table-view-checkbox': function(event) {
			// Retreive the position of the selected row
			var $target = $(event.currentTarget);
			var $row = $target.closest('tr');
			var data = $row.data('internal');

			if ($target.hasClass('ui-icon-checkbox-off')) {
				// Chose model between Dataset & children
				// HUGE problem with multiple feature collections cuz this view depends on model
				if (data) {
					var model = data.parent ? data.parent.childFc : this.model;
					// NGEO-2174: check every highlighted feature when clicking on already selected row
					model.select( $row.hasClass('row_highlighted') ? model.highlights : [data.feature] );
				} else {
					// "Select all" case
					var filteredFeatures = _.pluck(this.visibleRowsData, 'feature');
					this.model.selectAll(filteredFeatures);
					$target
						.removeClass('ui-icon-checkbox-off')
						.addClass('ui-icon-checkbox-on');
				}
			} else {
				if (data) {
					var model = data.parent ? data.parent.childFc : this.model;
					// NGEO-2174: uncheck every highlighted feature when clicking on already selected row
					model.unselect( $row.hasClass('row_highlighted') ? model.highlights : [data.feature] );
				} else {
					// "Unselect all" case
					this.model.unselectAll();
					$target
						.removeClass('ui-icon-checkbox-on')
						.addClass('ui-icon-checkbox-off');
				}
			}
		},

		'click #table-columns-button': function(event) {

			var self = this;
			$(tableColumnsPopup_template(this)).appendTo('.ui-page-active')
				.trigger('create')
				.popup({
					theme: 'c'
				})
				.on('change', 'input', function(event) {
					// Get the column to change
					var i = $(this).data('index');
					self.columnDefs[i].visible = $(this).is(':checked');

					// Rebuild the table with the new columns
					self.buildTable();
					self.buildTableContent();
				})
				.on('popupafterclose', function(event, ui) {
					$(this).remove();
				})
				.popup('open', {
					positionTo: this.$el.find('#table-columns-button')
				});
		},
		
		// Incremental pagination
		'click .loadMore' : function(event) {
			var rowData = $(event.currentTarget).closest('.paging').data("internal");
			// If row is already loading, exit !
			if (rowData.childFc.isLoading)
				return;

			rowData.childFc.appendPage( rowData.childFc.currentPage + 1 );
		}
	},

	/**
	 * Set the model to be used by the TableView
	 */
	setModel: function(model) {

		if (this.model) {
			// Clean-up previous data
			this.clear();

			// Clean-up callbacks
			this.stopListening(this.model);
		}

		this.model = model;
		var self = this;
		if (this.model) {
			this.listenTo(this.model, "reset:features", this.clear);
			this.listenTo(this.model, "add:features", this.addData);
			this.listenTo(this.model, "remove:features", this.removeData);
			this.listenTo(this.model, "selectFeatures", this.updateSelection);
			this.listenTo(this.model, "unselectFeatures", this.updateSelection);
			this.listenTo(this.model, "show:browses", this.showBrowses);
			this.listenTo(this.model, "hide:browses", this.hideBrowses);
			this.listenTo(this.model, "highlightFeatures", function(features){
				_allHighlights = _allHighlights.concat(features);
				self.triggerHighlightFeature();
			});
			this.listenTo(this.model, "update:downloadOptions", this.updateRows);

			if (this.model.features.length > 0) {
				this.addData(this.model.features);
			}

			// Apply filter for the new model
			if ( $('#filterTableInput').val() ) {
				this.filterData($('#filterTableInput').val());
			}
			
		}
	},
	
	/**
	 *	Update rows of given features
	 */
	updateRows: function(features) {

		for ( var i=0; i<features.length; i++ ) {
			var feature = features[i];
			var $row = this._getRowFromFeature(feature);
			var rowData = $row.data("internal");

			// Update offset
			var tdOffset = 1; // Since first <td> could be + and checkbox
			if ( rowData.isExpandable ) {
				tdOffset++;
			}

			// Update rowData according to columnDefs
			rowData.cellData.length = 0;
			for (var j = 0; j < this.columnDefs.length; j++) {
				var d = Configuration.getFromPath(feature, this.columnDefs[j].mData);
				rowData.cellData.push(d);
				$($row.find("td").get(j + tdOffset)).html(d);
			}

			this._updateRow(rowData, $row);
		}
		this.updateFixedHeader();
	},

	/**
	 * Expand a row
	 */
	expandRow: function($row) {

		var rowData = $row.data('internal');

		// If row is already loading, exit !
		if (rowData.isLoading)
			return;

		var expandUrl = null;
		if (DataSetSearch.get("mode") != "Simple") {
			// Interferometric search
			expandUrl = Configuration.getMappedProperty(rowData.feature, "interferometryUrl", null);
		} else {
			// Granules search
			expandUrl = Configuration.getMappedProperty(rowData.feature, "virtualProductUrl", null);
			// HACK: Update WEBS response from atom to json : to be fixed by WEBS later
			expandUrl = expandUrl.replace("format=atom", "format=json");
		}

		this.createChildrenFeatureCollection(rowData);
		// Launch search
		rowData.childFc.search(expandUrl);
	},

	/**
	 * Close a row
	 */
	closeRow: function($row) {

		var rowData = $row.data('internal');

		if (rowData.isLoading) {
			$row.next().remove();
		} else {

			if ( rowData.childFc ) {
				this.model.removeChild(rowData.feature.id);
			}

			rowData.children.length = 0;
			$row.nextAll('.child_of_'+ rowData.childFc.id).remove();
			$row.next('.paging_child_of_'+ rowData.childFc.id).remove();
		}
	},

	/**
	 * Highlight the features on the table when they have been highlighted on the map.
	 */
	highlightFeature: function(features, prevFeatures) {
		if (!this.$table) return;

		// Remove previous highlighted rows
		this.$table.find('.row_highlighted').removeClass('row_highlighted');

		if (features.length > 0) {
			var rows = this.$table.find("tbody tr");
			for (var i = 0; i < features.length; i++) {

				var $row = this._getRowFromFeature(features[i]);
				if ( $row ) {
					$row.addClass('row_highlighted');
				}
			}

			// NGEO-1941: Scroll to the most recent highlighted product in table
			var mostRecentFeature = _.max(features, function(f) {
				return new Date(Configuration.getMappedProperty(f, "stop"));
			});

			var $mostRecentRow = this._getRowFromFeature(mostRecentFeature);
			if ( $mostRecentRow && !_clickInTable ) {
				this._scrollTo($mostRecentRow);
			} else {
				_clickInTable = false;
			}

		}
	},

	/**
	 *	Scroll table elt to the given $row
	 *	Check if the the selected row isn't already visible btw
	 */
	_scrollTo: function($row) {
		var rowTop = $row.position().top;
		var offset = $row.height() / 2; // Take a half-height as an offset on both sides (top/bottom)
		var isVisibleInContent = (rowTop > offset && rowTop < this.$el.find(".table-content").height() - offset);
		if ( !isVisibleInContent ) {
			// Scroll only if not already visible in table content
			this.$el.find(".table-content").animate({
				scrollTop: rowTop - this.$el.find(".table-content tbody").position().top - 90 // "90" magic number to place in "center"
			}, {
				duration: 500,
				easing: "easeOutQuad"
			});
		}
	},

	/**
	 * Helper function to retreive a row from a feature
	 */
	_getRowFromFeature: function(feature) {
		if (this.feature2row.hasOwnProperty(feature.id)) {
			var $row = this.feature2row[feature.id];
			return $row;
		} else {
			return null;
		}
	},

	/**
	 *	Hide browses for the given features
	 */
	hideBrowses: function(features) {
		if (!this.$table) return;

		for (var i = 0; i < features.length; i++) {
			var $row = this._getRowFromFeature(features[i]);
			if ($row) { 
				$row.find('.browse-visibility-checkbox')
					.addClass('ui-icon-checkbox-off')
					.removeClass('ui-icon-checkbox-on');
			}
		}
	},

	/**
	 *	Show browses for the given features
	 */
	showBrowses: function(features) {
		if (!this.$table) return;

		for (var i = 0; i < features.length; i++) {
			var $row = this._getRowFromFeature(features[i]);
			if ($row) { 
				$row.find('.browse-visibility-checkbox')
					.removeClass('ui-icon-checkbox-off')
					.addClass('ui-icon-checkbox-on');
			}
		}
	},

	/**
	 * Update selection checkbox state for the given features
	 * based on "selection" property of current <FeatureCollection>
	 */
	updateSelection: function(features) {
		if (!this.$table) return;

		for (var i = 0; i < features.length; i++) {
			var $row = this._getRowFromFeature(features[i]);

			if ( $row && this.model.selection.indexOf(features[i]) >= 0 ) {
				// Feature is seleceted
				$row.find('.table-view-checkbox')
					.addClass('ui-icon-checkbox-on')
					.removeClass('ui-icon-checkbox-off');
			} else {
				// Feature isn't selected
				$row.find('.table-view-checkbox')
					.removeClass('ui-icon-checkbox-on')
					.addClass('ui-icon-checkbox-off');
			}
		}
	},

	/**
	 * Clear data
	 */
	clear: function() {
		if (this.$table) {
			this.$table.html('<div class="table-nodata">No data found</div>');

			this.rowsData = [];
			this.hasExpandableRows = false;

			// Reset the number of non-empty cells
			for (var i = 0; i < this.columnDefs.length; i++) {
				this.columnDefs[i].numValidCell = 0;
			}
		}
	},

	/**
	 *	Create row data for the given feature
	 */
	createRowData: function(feature, parentRowData) {

		var isExpandable = false;
		var hasGraticules = false;
		var links = Configuration.getMappedProperty(feature, "links", null);
		if (links) {
			// Is interferometric search
			isExpandable = Boolean(_.find(links, function(link) {
				return link['@rel'] == "related" && link['@title'] == "interferometry";
			}));
			hasGraticules |= Boolean(Configuration.getMappedProperty(feature, "virtualProductUrl", null));
			isExpandable |= hasGraticules;
		}

		var cleanedId = String(feature.id).replace(/\W/g,'_'); // Id without special characters
		var rowData = {
			feature: feature,
			cellData: [],
			isExpandable: isExpandable ? !parentRowData : false,
			isExpanded: this.model.children[cleanedId] ? true : false,
			hasGraticules: hasGraticules,
			isCheckable: (parentRowData && parentRowData.hasGraticules ? false : true),
			childFc: this.model.children[cleanedId],
			children: [],
			isLoading: false
		};

		var columns = this.columnDefs;
		for (var j = 0; j < columns.length; j++) {
			var d = Configuration.getFromPath(feature, columns[j].mData);
			rowData.cellData.push(d);
			if (d) {
				columns[j].numValidCell++;
			}
		}
		return rowData;
	},

	/**
	 * Add data 
	 */
	addData: function(features, model, parentRowData) {

		if (features.length > 0) {
			
			var hasGraticules = false;
			for (var i = 0; i < features.length; i++) {				
				var feature = features[i];
				var rowData = this.createRowData(feature, parentRowData);
				hasGraticules |= rowData.hasGraticules;

				if ( rowData.childFc ) {
					for ( var j=0; j<rowData.childFc.features.length; j++ ) {
						var childFeature = rowData.childFc.features[j];
						var childRowData = this.createRowData( childFeature, rowData );
						childRowData.parent = rowData;
						rowData.children.push(childRowData);
					}
				}

				if (parentRowData) {
					parentRowData.children.push(rowData);
					rowData.parent = parentRowData;
				} else {
					this.rowsData.push(rowData);
				}
			}

			// Interferometric mode or dataset containins graticules
			if (DataSetSearch.get("mode") != "Simple" || hasGraticules) {
				this.hasExpandableRows = true;
			}

			this.visibleRowsData = this.rowsData.slice(0);

			if ( !parentRowData ) {
				this.buildTable();
				this.buildTableContent();
			} else {
				// Update children only
				var $row = this._getRowFromFeature(parentRowData.feature);
				this.updateChildren(parentRowData, $row);
			}
		} else {
			if ( parentRowData ) {
				var $row = this._getRowFromFeature(parentRowData.feature);
				$('<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">No data found</td></tr>').insertAfter($row);
			} else if ( this.$table ) {
				this.$table.html('<div class="table-nodata">No data found</div>');
			}
		}
	},

	/**
	 * Remove data from the view
	 */
	removeData: function(features) {

		var rows = this.$table.find("tbody tr");
		for (var i = 0; i < features.length; i++) {

			var $row = this._getRowFromFeature(features[i]);
			if ($row) {
				$row.remove();

				for (var n = 0; n < this.visibleRowsData.length; n++) {
					if (this.visibleRowsData[n].feature == features[i]) {
						this.visibleRowsData.splice(n, 1);
						break;
					}
				}
			}

			for (var n = 0; n < this.rowsData.length; n++) {
				if (this.rowsData[n].feature == features[i]) {
					this.rowsData.splice(n, 1);
					break;
				}
			}

		}
	},

	/**
	 * Filter data
	 */
	filterData: function(val) {

		// Store previously visible rows to compute the newly hidden/shown features
		var previouslyVisibleRows = this.visibleRowsData.splice(0);

		// Reconstruct visible rows data after filtering
		this.visibleRowsData = [];
		for (var i = 0; i < this.rowsData.length; i++) {

			var match = false;
			for (var j = 0; !match && j < this.rowsData[i].cellData.length; j++) {
				match = String(this.rowsData[i].cellData[j]).search(val) >= 0;
			}

			if (match) {
				this.visibleRowsData.push(this.rowsData[i]);
			}
		}

		// Show/Hide filtered features on map
		var rowsToShow = _.difference(this.visibleRowsData, previouslyVisibleRows);
		var rowsToHide = _.difference(previouslyVisibleRows, this.visibleRowsData);
		this.model.showFeatures(_.map(rowsToShow, 'feature'));
		this.model.hideFeatures(_.map(rowsToHide, 'feature'));

		// Finally build the content
		this.buildTableContent();
	},

	/**
	 * Sort data
	 */
	sortData: function(columnIndex, order) {

		if (order == "original") {
			this.visibleRowsData = this.rowsData.slice(0);
		} else {
			this.visibleRowsData.sort(function(row1, row2) {
				if (row1.cellData[columnIndex] == row2.cellData[columnIndex]) {
					return 0;
				} else if (row1.cellData[columnIndex] < row2.cellData[columnIndex]) {
					return (order == "asc") ? -1 : 1;
				} else {
					return (order == "asc") ? 1 : -1;
				}
			});
		}

		this.buildTableContent();
	},

	/**
	 *	Create children feature collection for the given row data
	 */
	createChildrenFeatureCollection: function(rowData) {

		var $el;
		var child = this.model.createChild(rowData.feature.id);

		// Add "loading" label on start
		this.listenTo(child, 'startLoading', function(fc) {
			this.$el.find(".child_of_"+ child.id).remove();
			// Find element after which add 'loading'
			$el = this._getRowFromFeature(rowData.feature);

			var $loading = $('<tr class="loadingChildren">\
				<td></td>\
				<td></td>\
				<td colspan="' + this.columnDefs.length + '"><span class=""><img style="max-width: 20px; margin: 5px 0px;" src="../css/images/ajax-loader.gif"/></span></td>\
			</tr>').insertAfter($el);
			rowData.isLoading = true;
		});

		// Add features to table
		this.listenTo(child, 'add:features', function(features) {
			$el.next('.loadingChildren').remove();
			rowData.isLoading = false;
			if ( !rowData.isExpanded || !features )
				return;

			this.addData(features, this.model, rowData);
		});

		// Add "error message"
		this.listenTo(child, 'error:features', function(url) {
			rowData.isLoading = false;
			if ( !rowData.isExpanded )
				return;
			$el.next('.loadingChildren').remove();
			$('<tr>\
				<td></td>\
				<td></td>\
				<td colspan="' + this.columnDefs.length + '">Error while loading</td>\
			</tr>').insertAfter($el);
		});

		// Reset features
		this.listenTo(child, 'reset:features', function(fc) {
			rowData.children.length = 0;
		});
		var self = this;
		this.listenTo(child, "highlightFeatures", function(features) {
			_allHighlights = _allHighlights.concat(features);
			self.triggerHighlightFeature();
		});
		this.listenTo(child, "selectFeatures", this.updateSelection);
		this.listenTo(child, "unselectFeatures", this.updateSelection);

		// Attach to rowData
		rowData.childFc = child;
	},

	/**
	 *	Upate child (expanded) view
	 */
	updateChildren: function(rowData, $row) {
		$row.siblings('.child_of_'+ rowData.childFc.id).remove();
		$row.siblings('.paging_child_of_'+ rowData.childFc.id).remove();

		if ( rowData.children.length > 0 ) {
			for (var n = 0; n < rowData.children.length; n++) {
				this._createRow(rowData.children[n], $row, {
					className: "child_of_"+ rowData.childFc.id,
					isChild: true
				});
			}

			this._createPagination( rowData, $row );
		} else {
			$('<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">No data found</td></tr>').insertAfter($row);
		}
	},

	/**
	 *	Update the existing row with the given rowData
	 */
	_updateRow: function(rowData, $row) {

		var content = '';
		// Manage expand
		if (this.hasExpandableRows) {

			if (rowData.isExpandable) {
				if (rowData.isExpanded) {
					content += '<td><span class="table-view-expand ui-icon ui-icon-minus "></span></td>';
				} else {
					content += '<td><span class="table-view-expand ui-icon ui-icon-plus "></span></td>';
				}
			} else {
				content += '<td></td>';
			}
		}

		var checkedClass = 'ui-icon-checkbox-off'; // By default
		// Take into account the previous state of input
		if ($row.find(".table-view-checkbox").length > 0 && $row.find(".table-view-checkbox").hasClass("ui-icon-checkbox-on")) {
			checkedClass = 'ui-icon-checkbox-on';
		}

		// Layer selection checkbox
		var checkboxVisibility = (rowData.isCheckable ? "inline-block" : "none");
		content += '<td><span style="display:'+ checkboxVisibility +'" class="table-view-checkbox ui-icon '+ checkedClass +'"></span></td>';

		// Layer browse visibility checkbox
		/*
		//var browseVisibilityClass = rowData.feature._browseShown ? "ui-icon-checkbox-on" : "ui-icon-checkbox-off";
		var browseVisibilityClass = rowData.feature._featureCollection.isHighlighted(rowData.feature) ? "ui-icon-checkbox-on" : "ui-icon-checkbox-off";
		content += '<td><span class="browse-visibility-checkbox ui-icon '+ browseVisibilityClass + '"></span></td>';
		*/

		for (var j = 0; j < rowData.cellData.length; j++) {

			if (this.columnDefs[j].visible && this.columnDefs[j].numValidCell > 0) {
				// Check if column has some specific classes
				var classes = null;
				if (this.columnDefs[j].getClasses) {
					classes = this.columnDefs[j].getClasses(rowData.feature);
				}

				var cellDataColumn = rowData.cellData[j];
				if (classes && cellDataColumn) {
					if ( classes == "downloadOptions" ) {
						var doIndex = cellDataColumn.indexOf("ngEO_DO");
						if ( doIndex >= 0 )
							cellDataColumn = cellDataColumn.substr( doIndex+8 ).replace(/,(\w)/g,", $1"); // Just add whitespace between properties
						else
							cellDataColumn = "No download options";
					}
					content += '<td title="'+ cellDataColumn +'" class="' + classes + '">' + cellDataColumn + '</td>';
				} else {
					content += '<td title="'+ cellDataColumn +'">' + cellDataColumn + '</td>';
				}
			}
		}
		$row.html(content);

		var browses = Configuration.getMappedProperty(rowData.feature, "browses");
		if ( browses && browses.length > 1 ) {
			$row.find('.browse-visibility-checkbox').after('<span title="Multiple browse management" class="multipleBrowse"></span>');
		}
	},

	/**
	 * Create a row given rowData
	 */
	_createRow: function(rowData, $body, options) {
		// Update from options
		var className = null;
		var isChild = false;
		if ( options ) {
			className = options.className;
			isChild = options.isChild;
		}

		var $row = $('<tr '+ (className ? 'class="'+ className + '"' : "") +'></tr>');
		this._updateRow(rowData, $row);
		if ( isChild ) {
			$row = $row.insertAfter($body);
		} else {
			$row = $row.appendTo($body);
		}
		$row.data('internal', rowData);
		this.feature2row[rowData.feature.id] = $row;
	},

	/**
	 *	Create pagination for children elements
	 */
	_createPagination: function(rowData, $body) {

		var $lastChild = $body.nextAll('.child_of_'+ rowData.childFc.id +':last');
		// Incremental pagination
		// if ( rowData.childFc.currentPage != rowData.childFc.lastPage ) {
		// 	$('<tr class="paging_child_of_'+ rowData.childFc.id +'"><td></td><td></td>\
		// 		<td colspan="' + this.columnDefs.length + '">\
		// 			<div class="paging">\
		// 				<a class="loadMore" data-iconpos="notext" data-icon="plus" data-role="button" data-mini="true" data-inline="true">Load more</a>\
		// 			</div>\
		// 		</td>\
		// 	   </tr>')
		// 		.insertAfter($lastChild)
		// 		.trigger("create")
		// 		.find('.paging')
		// 			.data("internal", rowData);
		// }
		
		// Next/Prev pagination
		if ( rowData.childFc.totalResults > rowData.childFc.countPerPage ) {

			var $pagination = $('<tr class="paging_child_of_'+ rowData.childFc.id +'"><td></td><td></td>\
				<td colspan="' + this.columnDefs.length + '">\
				</td>\
			   </tr>')
				.insertAfter($lastChild);

			var pagination = new Pagination({
				model: rowData.childFc,
				el: $pagination.find("td:last")
			});
			pagination.render();

			$pagination.trigger("create");
		}
	},

	/**
	 * Build table content from data
	 */
	buildTableContent: function() {
		var $body = this.$table.find('tbody');
		$body.empty();

		this.feature2row = {};

		for (var i = 0; i < this.visibleRowsData.length; i++) {

			var rowData = this.visibleRowsData[i];
			this._createRow(rowData, $body);

			if (rowData.isExpanded) {
				var $row = this.feature2row[rowData.feature.id];
				this.updateChildren(rowData, $row);
			}

		}

		this.updateFixedHeader();
		this.updateSelection(this.model.selection);
		// TODO: Make this view dependent on model only ...
		// FIXME: check if hereafter commented line is really needed
		// _allHighlights = _allHighlights.concat(this.model.highlights);
		this.triggerHighlightFeature();
	},

	/**
	 * Update fixed header
	 */
	updateFixedHeader: function() {
		if (this.$table) {
			var $tableHeader = this.$el.find('.table-header');
			// Reinit min width of every "td/th" before computing the real width
			$tableHeader.css('margin-right', 0).end()
				.find('th').css('min-width',"");
			this.$table
				.find('colgroup').remove().end()
				.find('thead').show().end()
				.find('td').css('min-width', "");
			this.$headerTable.find('colgroup').remove();
			
			// Compute actual col-width per th
			var self = this;
			var colWidths = this.$table.find("tr:first").children().map(function(index) {
				var headerWidth = self.$table.find("th:nth-child("+(index+1)+")").outerWidth();
				return $(this).outerWidth() > headerWidth ? $(this).outerWidth : headerWidth;
			});

			// Create COLGROUP
			var $colgroup = $("<colgroup></colgroup>");
			var colSumWidth = _.reduce(colWidths, function(sum, w) { return sum+w;}, 0);
			var hasSlider = colSumWidth > $(window).width() - 1;
			for ( var i=0; i<colWidths.length; i++ ) {
				if ( hasSlider ) {
					// Set min-width since it forces table to be wider than window --> show slider
					$tableHeader.find('th:nth-child('+(i+1)+')')
						.css('min-width', colWidths[i]);
					this.$table.find('td:nth-child('+(i+1)+')')
						.css('min-width', colWidths[i]);
				} else {
					$colgroup.append("<col width=" + colWidths[i] + ">");
				}
			}

			if ( hasSlider ) {
				this.$el.find('.table-view').removeClass("fullscreenWidth");
			} else {
				this.$el.find('.table-view').addClass("fullscreenWidth");
				// Copy table COLGROUP to grid head and grid foot
				$colgroup
					.insertBefore(this.$table.find('thead'))
					.clone()
					.insertBefore(this.$headerTable.find('thead'));
			}

			this.$table.find('thead').hide();
			var diffWidth = this.$headerTable.width() - this.$table.width();
			$tableHeader.css('margin-right', diffWidth);
		}

	},

	/**
	 * Show the table
	 */
	show: function() {
		this.$el.show();
		if (this.rowsData.length > 0) {
			this.updateFixedHeader();
		}
		
		// Scroll to the most recent product if selected
		var highlightedRows = this.$el.find('.row_highlighted');
		if ( highlightedRows.length ) {
			var mostRecentRow = _.max(highlightedRows, function(row) {
				var feature = $(row).data('internal').feature;
				return new Date(Configuration.getMappedProperty(feature, "stop"));
			});
			this._scrollTo($(mostRecentRow));
		}

		this.visible = true;
	},

	/**
	 * Hide the table
	 */
	hide: function() {
		this.$el.hide();
		this.visible = false;
	},

	/**
	 * Build the main table element
	 */
	buildTable: function() {

		this.$el.find('.inner-container').remove();
		this.$el.find('.table-nodata').remove();

		if (this.rowsData.length == 0) {
			this.$el.prepend('<div class="table-nodata">No data to display</div>');
			return;
		}


		// Build the table
		var $table = $('<table cellpadding="0" cellspacing="0" border="0" class="table-view"><thead></thead><tbody></tbody></table>');
		var $thead = $table.find('thead');
		var $row = $('<tr></tr>').appendTo($thead);
		var columns = this.columnDefs;
		if (this.hasExpandableRows) {
			$row.append('<th></th>');
		}
		$row.append('<th><span class="table-view-checkbox ui-icon ui-icon-checkbox-off "></th>');
		//$row.append('<th class="browseVisibility"></th>');

		for (var j = 0; j < columns.length; j++) {
			if (columns[j].visible && columns[j].numValidCell > 0) {
				$row.append('<th>' + columns[j].sTitle + '</th>');
			}
		}

		var $container = $('<div class="inner-container"></div>').prependTo(this.$el);
		// Override the tine rectangle on scrollbar crossing bars
		$('<div style="position: absolute;background: #292929;bottom: 0px;right: 0px;width: 15px; height: 16px;z-index: 1;"></div>').appendTo($container);

		this.$table = $table.prependTo($container);

		// Build the fixed header table
		this.$table.wrap('<div class="table-content"></div>');
		this.$headerTable = this.$table.clone().prependTo($container).wrap('<div class="table-header"></div>');
		this.$table.find('thead').hide();


		// Update header as well
		this.$el.find(".table-content").scroll(function () {
			$(".table-header").offset({ left: -1*this.scrollLeft });
		});
	},

	/**
	 * Render the table
	 */
	render: function() {

		// Update column definition  with the visible flag and a counter to know the number of non-empty cell
		for (var i = 0; i < this.columnDefs.length; i++) {
			this.columnDefs[i].visible = i < this.maxVisibleColumns;
			this.columnDefs[i].numValidCell = 0;
		}

		this.visible = false;
		this.featuresToAdd = [];
		$(window).resize($.proxy(this.updateFixedHeader, this));

		this.buildTable();

		this.renderFooter();

		this.$el.trigger('create');
	},

	/**
	 * Render footer
	 */
	renderFooter: function() {
		var footer = $('<div id="tableFooter" class="ui-grid-a"></div>')
			.append('<div class="table-filter ui-block-a">\
						<div data-role="fieldcontain" style="width: 300px; display: inline-block; top: 5px; vertical-align: super;" >\
							<input id="filterTableInput" data-inline="true" data-mini="true" type="text" placeholder="Filter products..." />\
						</div>\
						<button data-mini="true" data-inline="true" id="table-columns-button" title="Select columns to display in table" >Columns</button>\
					</div>\
					<div class="ui-block-b table-rightButtons"><div data-role="fieldcontain"></div></div>');
		var $buttonContainer = $(footer).find(".table-rightButtons [data-role='fieldcontain']");

		if (this.renderButtons)
			this.renderButtons($buttonContainer);

		this.$el.append(footer).trigger("create");
		// HACK jQm Firefox: Display text-input on the same level as label & button
		this.$el.find('.table-filter .ui-input-text').css("vertical-align","middle");
	},

	/**
	 *	Refresh method
	 */
	refresh: function() {
		this.updateFixedHeader();
	}
});

module.exports = TableView;