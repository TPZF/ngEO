define(
		[ 'jquery', 'backbone', 'configuration', 'jquery.mobile',
				'jquery.dataTables' ],
		function($, Backbone, Configuration) {

			//TODO THIS IS A FIRST TESTING VERSION
			
			var DataAccessRequestMonitoringView = Backbone.View.extend({

				render : function() {

					var columnsDef = [ {
						'sTitle' : '',
						'bSortable' : false,
						'mData' : null,
						'sWidth' : '20px',
						'sDefaultContent' : '<span class="dataTables_chekbox ui-icon ui-icon-checkbox-off "></span>'
					} ];
					columnsDef = columnsDef
							.concat(Configuration.data.DARMonitoringTable.columnsDef);

					var self = this;
					this.table = this.$el.dataTable(
									{
										"sDom" : '<"top"i>rt<"bottom"flp><"clear">',
										"aaData" : this.model.get('dataAccessRequestStatuses'),
										"aoColumns" : columnsDef,
										"bDestroy" : true,
										"bAutoWidth" : false,
										"aLengthMenu" : [ 5, 10, 25],
										"iDisplayLength" : 5,
										"bLengthChange" : true,
										"bFilter": false,
										"bPaginate" : true,
										"bSort" : true,
										"fnDrawCallback" : function(
												oSettings) {
											// insure that JQM styling
											// is still kept after
											// sorting and pagination
											$("#datatable_filter input")
													.attr('data-mini',
															'true');
											$("#datatable_filter label")
													.attr('data-mini',
															'true');

											$("#datatable_length select")
													.attr(
															{
																'data-inline' : 'true',
																'data-mini' : 'true',
															});

											// enable and disable
											// pagination buttons
											// according to pagination
											// status
											if ($("#datatable_next")
													.hasClass(
															'paginate_disabled_next')) {
												$("#datatable_next")
														.addClass(
																'ui-disabled');
											}

											if ($("#datatable_previous")
													.hasClass(
															'paginate_disabled_previous')) {
												$("#datatable_previous")
														.addClass(
																'ui-disabled');
											}

											self.$el.trigger('create');
										},

									});
					// Style the div of the datatable footer
					$(".bottom").addClass("ui-grid-b");
					$("#datatable_length").addClass("ui-block-a");

					// Add JQM styling for pagination elements
					$("#datatable_paginate").addClass("ui-block-b");
					// add JQM styling to the previous button
					$("#datatable_previous").attr({
						"data-mini" : "true",
						"data-role" : "button",
						"data-icon" : "arrow-l",
						"data-iconpos" : "left",
						"data-inline" : "true"
					});
					// add JQM styling to the next button
					$("#datatable_next").attr({
						"data-mini" : "true",
						"data-role" : "button",
						"data-icon" : "arrow-r",
						"data-iconpos" : "right",
						"data-inline" : "true"
					});

					// enable and disable pagination buttons according
					// to pagination status
					if ($("#datatable_next").hasClass(
							'paginate_disabled_next')) {
						$("#datatable_next").addClass('ui-disabled');
					}
					if ($("#datatable_previous").hasClass(
							'paginate_disabled_previous')) {
						$("#datatable_previous")
								.addClass('ui-disabled');
					}

					// add JQM styling for filter text input
					$("#datatable_filter").addClass("ui-block-c");
					$("#datatable_filter input").attr("data-mini",
							"true");

					this.$el.trigger('create');
				},

				// get the geojson features related to the selected
				// records as a table.
				// used to trigger display browses event for map
				getSelectedFeatures : function() {
					var features = [];
					var indexes = []; // are kept here in case to
					// change the triggering events
					// with indexes
					var self = this;
					// var selectedNodes =
					// this.table.$('tr.row_selected');
					var selectedNodes = this.table.$(
							'.ui-icon-checkbox-on').closest('tr');

					_.each(selectedNodes,
							function(node, index) {
								var rowPos = self.table
										.fnGetPosition(node);
								indexes.push(rowPos);
								features.push(self.model
										.get('features')[rowPos]);

							});
					// console.log(indexes);
					// console.log(features);

					return features;
				},

		});

	return DataAccessRequestMonitoringView;

});