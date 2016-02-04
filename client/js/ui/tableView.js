var Configuration = require('configuration');
var DataSetSearch = require('search/model/datasetSearch');
var Map = require('map/map');
var tableColumnsPopup_template = require('ui/template/tableColumnsPopup');

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

		// Call when a row is clicked
		'click tr': function(event) {

			var $row = $(event.currentTarget);
			if ($row.hasClass('row_selected')) {
				return; // Nothing to do
			}

			if (this.model.highlight) {
				var data = $row.data('internal');
				if (data && data.feature) {
					this.model.highlight([data.feature]);
				}
			}
		},

		// Call when the header is clicked : sort
		'click th': function(event) {

			var $cell = $(event.currentTarget);
			$cell.siblings("th").removeClass('sorting_asc').removeClass('sorting_desc');

			if ($cell.find('.table-view-checkbox').length > 0)
				return;

			if ($cell.hasClass('sorting_asc')) {
				$cell.removeClass('sorting_asc');
				this.sortData(-1, 'original');
			} else if ($cell.hasClass('sorting_desc')) {
				$cell.removeClass('sorting_desc');
				$cell.addClass('sorting_asc');
				this.sortData($cell.index(), 'asc');
			} else {
				$cell.addClass('sorting_desc');
				this.sortData($cell.index(), 'desc');
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

		// Called when the user clicks on the checkbox of the dataTables
		'click .table-view-checkbox': function(event) {
			// retreive the position of the selected row
			var $target = $(event.currentTarget);
			var $row = $target.closest('tr');
			var data = $row.data('internal');

			if ($target.hasClass('ui-icon-checkbox-off')) {
				if (data) {
					this.model.select(data.feature);
				} else {
					var filteredFeatures = _.pluck(this.visibleRowsData, 'feature');
					this.model.selectAll(filteredFeatures);
					$target
						.removeClass('ui-icon-checkbox-off')
						.addClass('ui-icon-checkbox-on');
				}
			} else {
				if (data) {
					this.model.unselect(data.feature);
				} else {
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
		
		// First pagination draft (only "more" button)
		'click .loadMore' : function(event) {
			var rowData = $(event.currentTarget).data("rowData");
			var expandUrl = Configuration.getMappedProperty(rowData.feature, "virtualProductUrl", null);
			var self = this;
			rowData.isLoading = true;
			$.ajax({
				type: "GET",
				url: expandUrl + "&startIndex=" + (rowData.children.length+1) + "&count=2",
				success: function(data) {
					self.handleExpandedData(rowData, data);
				},
				error: function() {
					console.error("ERROR on pagination");
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				rowData.isLoading = false;
				if (!rowData.isExpanded)
					return;
				$('<tr><td></td><td></td><td colspan="' + self.columnDefs.length + '">Error while loading</td></tr>').insertAfter($row)
			});
		}
	},

	/**
	 *	Handle expanded data
	 *	Expanded data could be a graticules or interferometry
	 */
	handleExpandedData: function(parentRowData, data) {
		if (DataSetSearch.get("mode") == "Simple") {
			// Graticules : extract from source property
			data = _getObjects(data, "source", { firstFound: true }).source;
		}

		parentRowData.isLoading = false;
		if ( !parentRowData.isExpanded || !data.features )
			return;
		
		if (data.features.length == 0) {
			$('<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">No data found</td></tr>').insertAfter($row)
		} else {
			parentRowData.totalNumChildren = data.properties.totalResults;

			// Uncomment if the interferred features will have the same id... sort of hack
			// think how to handle it within a cleaner way
			// _.each(data.features, function(feature) {
			// 	feature.id = feature.id+="_interf";
			// });

			// HACK : do not use addFeatures but just the event in order to add element to the table and the map
			this.model.trigger('add:features', data.features, this.model, parentRowData);
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

		if (this.model) {
			this.listenTo(this.model, "reset:features", this.clear);
			this.listenTo(this.model, "add:features", this.addData);
			this.listenTo(this.model, "remove:features", this.removeData);
			this.listenTo(this.model, "selectFeatures", this.toggleSelection);
			this.listenTo(this.model, "unselectFeatures", this.toggleSelection);
			this.listenTo(this.model, "highlightFeatures", this.highlightFeature);
			this.listenTo(this.model, "update:downloadOptions", this.updateRows);

			if (this.model.features.length > 0) {
				this.addData(this.model.features);
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
			rowData.cellData.length = 0;

			var tdOffset = 1; // Since first <td> could be + and checkbox
			if ( rowData.cellData.isExpandable ) {
				tdOffset++;
			}
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

		// First add a row for loading
		$('<tr>\
			<td></td>\
			<td></td>\
			<td colspan="' + this.columnDefs.length + '">Loading...</td>\
		</tr>').insertAfter($row);

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
		}
		if (expandUrl) {
			// Now load the data
			rowData.isLoading = true;
			var self = this;
			$.ajax({
				//url: rowData.feature.properties.rel + "&count=10&startIndex=1&format=json",
				url: expandUrl + "&count=2&startIndex=1&format=json",
				dataType: 'json'

			}).done(function(data) {
				$row.next().remove();
				self.handleExpandedData(rowData, data);
			}).fail(function(jqXHR, textStatus, errorThrown) {
				rowData.isLoading = false;
				if (!rowData.isExpanded)
					return;
				$row.next().remove();
				$('<tr><td></td><td></td><td colspan="' + self.columnDefs.length + '">Error while loading</td></tr>').insertAfter($row)
			});
		}


	},

	/**
	 * Close a row
	 */
	closeRow: function($row) {

		var rowData = $row.data('internal');

		if (rowData.isLoading) {
			$row.next().remove();
		} else {
			var features = [];
			for (var i = 0; i < rowData.children.length; i++) {
				features.push(rowData.children[i].feature);
			}
			var newSelection = _.difference(this.model.selection, features);
			this.model.setSelection(newSelection);
			this.model.trigger('remove:features', features, this.model);
			rowData.children.length = 0;
			this.buildTableContent();
		}
	},


	/**
	 * Highlight the features on the table when they have been highlighted on the map.
	 */
	highlightFeature: function(features, prevFeatures) {
		if (!this.$table) return;

		// Remove previous highlighted rows
		this.$table.find('.row_selected').removeClass('row_selected');

		if (features.length > 0) {
			var rows = this.$table.find("tbody tr");
			for (var i = 0; i < features.length; i++) {

				var $row = this._getRowFromFeature(features[i]);
				if ( $row ) {
					$row.addClass('row_selected');
				}
			}

			// NGEO-1941: Scroll to the most recent highlighted product in table
			var mostRecentFeature = _.max(features, function(f) {
				return new Date(Configuration.getMappedProperty(f, "stop"));
			});

			var $mostRecentRow = this._getRowFromFeature(mostRecentFeature);
			if ( $mostRecentRow ) {
				this._scrollTo($mostRecentRow);
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
	 * Toggle selection for the given features
	 */
	toggleSelection: function(features) {
		if (!this.$table) return;

		for (var i = 0; i < features.length; i++) {
			var $row = this._getRowFromFeature(features[i]);
			if ($row) {
				$row.find('.table-view-checkbox')
					.toggleClass('ui-icon-checkbox-off')
					.toggleClass('ui-icon-checkbox-on');
			}
		}
	},

	/**
	 * Clear data
	 */
	clear: function() {
		if (this.$table) {
			this.$table.find('tbody').empty();

			this.rowsData = [];
			this.hasExpandableRows = false;

			// Reset the number of non-empty cells
			for (var i = 0; i < this.columnDefs.length; i++) {
				this.columnDefs[i].numValidCell = 0;
			}
		}
	},

	/**
	 * Add data 
	 */
	addData: function(features, model, parentRowData) {

		if (features.length > 0) {
			var columns = this.columnDefs;
			
			var hasGraticules = false;
			for (var i = 0; i < features.length; i++) {				

				var isExpandable = false;
				var links = Configuration.getMappedProperty(features[i], "links", null);
				if (links) {
					// Is interferometric search
					isExpandable = Boolean(_.find(links, function(link) {
						return link['@rel'] == "related" && link['@title'] == "interferometry";
					}));
					hasGraticules |= Boolean(Configuration.getMappedProperty(features[i], "virtualProductUrl", null));
					isExpandable |= hasGraticules;
				}

				var rowData = {
					feature: features[i],
					cellData: [],
					isExpandable: isExpandable ? !parentRowData : false,
					isExpanded: false,
					hasGraticules: hasGraticules,
					isCheckable: (parentRowData && parentRowData.hasGraticules ? false : true),
					children: [],
					isLoading: false,
					totalNumChildren: 0
				};
				for (var j = 0; j < columns.length; j++) {
					var d = Configuration.getFromPath(features[i], columns[j].mData);
					rowData.cellData.push(d);
					if (d) {
						columns[j].numValidCell++;
					}
				}

				if (parentRowData) {
					parentRowData.children.push(rowData);
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
				// No need to rebuild all the table of the data has been added to parent
				this.buildTable();
			}
			this.buildTableContent();
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

		this.buildTableContent();
	},

	/**
	 * Sort data
	 */
	sortData: function(columnIndex, order) {

		columnIndex -= this.hasExpandableRows ? 2 : 1;

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

		var checkboxVisibility = (rowData.isCheckable ? "inline-block" : "none");
		content += '<td><span style="display:'+ checkboxVisibility +'" class="table-view-checkbox ui-icon '+ checkedClass +'"></span></td>';
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
					content += '<td class="' + classes + '">' + cellDataColumn + '</td>';
				} else {
					content += '<td>' + cellDataColumn + '</td>';
				}
			}
		}
		$row.html(content);
	},

	/**
	 * Create a row given rowData
	 */
	_createRow: function(rowData, $body) {
		var $row = $('<tr></tr>');
		this._updateRow(rowData, $row);
		$row = $row.appendTo($body);
		$row.data('internal', rowData);
		this.feature2row[rowData.feature.id] = $row;
	},

	/**
	 *	Create pagination for children elements
	 */
	_createPagination: function(rowData, $body) {
		$('<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '"><a class="loadMore" data-iconpos="notext" data-icon="plus" data-role="button" data-mini="true" data-inline="true">Load more</a></td></tr>')
			.appendTo($body)
			.trigger("create")
			.find('a')
				.data("rowData", rowData);
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
				if ( rowData.children.length > 0 ) {
					for (var n = 0; n < rowData.children.length; n++) {
						this._createRow(rowData.children[n], $body);
					}

					if ( rowData.totalNumChildren != rowData.children.length ) {
						this._createPagination( rowData, $body );
					}
				} else {
					$('<tr><td></td><td></td><td colspan="' + this.columnDefs.length + '">No data found</td></tr>').appendTo($body);
				}
			}

		}

		this.updateFixedHeader();
		this.toggleSelection(this.model.selection);
		this.highlightFeature(this.model.highlights, []);
	},

	/**
	 * Update fixed header
	 */
	updateFixedHeader: function() {
		if (this.$table) {
			this.$el.find('.table-header').css('margin-right', 0);
			this.$table.find('colgroup').remove();
			this.$headerTable.find('colgroup').remove();

			this.$table.find('thead').show();
			
//			var maxColWidth = 700;
			var colWidths = this.$table.find("tr:first").children().map(function() {
//				return ($(this).outerWidth() > maxColWidth) ? maxColWidth : $(this).outerWidth();
				return $(this).outerWidth();
			});

			// Create COLGROUP
			var $colgroup = $("<colgroup></colgroup>");
			for ( var i=0; i<colWidths.length; i++ ) {
				$colgroup.append("<col width=" + colWidths[i] + ">");
			}

			// Copy table COLGROUP to grid head and grid foot
			$colgroup
				.insertBefore(this.$table.find('thead'))
				.clone()
				.insertBefore(this.$headerTable.find('thead'));

			this.$table.find('thead').hide();
			var diffWidth = this.$headerTable.width() - this.$table.width();
			this.$el.find('.table-header').css('margin-right', diffWidth);
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
		var selectedRows = this.$el.find('.row_selected');
		if ( selectedRows.length ) {
			var mostRecentRow = _.max(selectedRows, function(row) {
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

		this.$el.find('.table-content').remove();
		this.$el.find('.table-header').remove();
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
		for (var j = 0; j < columns.length; j++) {
			if (columns[j].visible && columns[j].numValidCell > 0) {
				$row.append('<th>' + columns[j].sTitle + '</th>');
			}
		}

		this.$table = $table.prependTo(this.el);

		// Build the fixed header table
		this.$table.wrap('<div class="table-content"></div>');
		this.$headerTable = this.$table.clone().prependTo(this.el).wrap('<div class="table-header"></div>');
		this.$table.find('thead').hide();
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
						<div data-role="fieldcontain" style="display: inline-block; width: 351px;" data-inline="true">\
							<label for="filterTableInput">Filter table:</label>\
							<input id="filterTableInput" style="display: inline-block; width: 72%;" data-mini="true" type="text"/>\
						</div>\
						<button data-mini="true" data-inline="true" id="table-columns-button">Columns</button>\
					</div>\
					<div class="ui-block-b table-rightButtons"><div data-role="fieldcontain"></div></div>');
		var $buttonContainer = $(footer).find(".table-rightButtons [data-role='fieldcontain']");

		if (this.renderButtons)
			this.renderButtons($buttonContainer);


		this.$el.append(footer);
	},

	/**
	 *	Refresh method
	 */
	refresh: function() {
		this.updateFixedHeader();
	}
});

module.exports = TableView;