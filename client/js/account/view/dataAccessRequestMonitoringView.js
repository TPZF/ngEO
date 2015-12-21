var Configuration = require('configuration');
var accountDARs_template = require('account/template/accountDARsContent');
var DAR_monitoring_template = require('account/template/dataAccessRequestMonitoringContent');
var darFilter_template = require('account/template/darMonitoringFilterContent');

var DownloadManagers = require('dataAccess/model/downloadManagers');
var reassingDownloadPopup_template = require('account/template/reassignDownloadPopupContent');

var validStatusesConfig = Configuration.localConfig.dataAccessRequestStatuses.validStatuses;

// Animation timeout callbacks
var timeouts = {};

var DataAccessRequestMonitoringView = Backbone.View.extend({

	initialize: function() {
		this.model.on("update:status", this.updateStatus, this);
		this.model.on("error:statusUpdate", function(request) {
			// TODO !
		});

		this.model.on("sync", this.render, this);
		this.model.on("error", this.error, this);
	},

	events: {

		// Pause/Unpause the given DAR handler
		'click .pauseResumeButton' : function(event) {
			var dar = $(event.currentTarget).closest('.darStatus').data("DAR");
			
			// Toggle status : processing/paused
			if (dar.status == validStatusesConfig.inProgressStatus.value) {
				this.model.requestChangeStatus(dar.ID, validStatusesConfig.pausedStatus.value);
			} else if (dar.status == validStatusesConfig.pausedStatus.value) {
				this.model.requestChangeStatus(dar.ID, validStatusesConfig.inProgressStatus.value);
			} else {
				//not supported case : should not happen !
				console.warn("Not supported status : " + status);
			}
		},

		// Stop the given DAR event handler
		'click .stopDownloadButton' : function(event) {
			var darId = $(event.currentTarget).closest('.darStatus').data("DAR").ID;
			
			// Stop the given dar
			this.model.requestChangeStatus(darId, validStatusesConfig.cancelledStatus.value);
		},

		// Reassign button
		'click #reassignDM' : function(event){
			var $button = $(event.currentTarget);

			// if ( $button.text() == "OK" ) {

				// Reassign dars
				var self = this;
				var selectedDarIds = [];
				this.$el.find('.ui-icon-checkbox-on').each(function(input) {
					var dar = $(this).next('.darStatus').data("DAR");
					selectedDarIds.push( dar.ID );
				});

				if ( selectedDarIds.length ) {

					// Open download manager list
					$openedPopup = $(reassingDownloadPopup_template( DownloadManagers.attributes )).appendTo('.ui-page-active');
					$openedPopup.popup()
						.bind("popupafterclose", function() {
							$(this).remove();
						});

					$openedPopup.popup("open").trigger("create");

					// Center it
					// TODO: reuse code from layerManagerView ! Refactor it..
					var popupContainer = $openedPopup.closest('.ui-popup-container');
					$(popupContainer).css({
						'top': Math.abs((($(window).height() - $(popupContainer).outerHeight()) / 2) + $(window).scrollTop()),
						'left': Math.abs((($(window).width() - $(popupContainer).outerWidth()) / 2) + $(window).scrollLeft())
					});

					// Define callbacks for the given buttons
					$openedPopup
						.find('.submit').click(function(){
							// Send request
							self.model.reassignDownloadManager( selectedDarIds, $openedPopup.find("select").val() );
							$openedPopup.popup("close");
						}).end()
						.find(".cancel").click(function(){
							//console.log("Cancel");
							$openedPopup.popup("close");
						});
				}

				// this.$el.find('.checkDar').css({
				// 	// visibility: "hidden",
				// 	width: "0px"
				// 	//opacity: 0
				// });
				// $button.html("Re-assign download managers").button("refresh");
			// } else {
				// Show checkboxes to allow user to select dars which must be re-assigned
				// this.$el.find('.checkDar').removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off').css({
				// 	// visibility: "visible",
				// 	width: "18px"
				// 	//opacity: 1
				// });
				// $button.html("OK").button("refresh");
			// }
		},

		// Pause all checked DAR statuses
		'click #pauseAll' : function(){
			var self = this;
			this.$el.find('.ui-icon-checkbox-on').each(function(input) {
				var dar = $(this).next('.darStatus').data("DAR");
				if ( dar.status == validStatusesConfig.inProgressStatus.value ) {
					self.model.requestChangeStatus(dar.ID, validStatusesConfig.pausedStatus.value);
				}
			});
		},

		// Resume all DAR checked statuses
		'click #resumeAll' : function(){
			var self = this;
			this.$el.find('.ui-icon-checkbox-on').each(function(input) {
				var dar = $(this).next('.darStatus').data("DAR");
				if ( dar.status == validStatusesConfig.pausedStatus.value ) {
					self.model.requestChangeStatus(dar.ID, validStatusesConfig.inProgressStatus.value);
				}
			});
		},

		// Stop all DAR checked statuses
		'click #stopAll' : function(){
			var self = this;
			this.$el.find('.ui-icon-checkbox-on').each(function(input) {
				var dar = $(this).next('.darStatus').data("DAR");
				if ( dar.status != validStatusesConfig.cancelledStatus.value ) {
					self.model.requestChangeStatus(dar.ID, validStatusesConfig.cancelledStatus.value);
				}
			});
		},

		// Update checked dar needed to reassign
		'click .checkDar' : function(event) {
			var $button = $(event.currentTarget);
			if ( $button.hasClass('ui-icon-checkbox-off') ) {
				$button.removeClass('ui-icon-checkbox-off').addClass('ui-icon-checkbox-on');
			} else {
				$button.removeClass('ui-icon-checkbox-on').addClass('ui-icon-checkbox-off');
			}
			this.updateFooterButtonsState();
		},

		// Filter statuses by download manager
		'click li': function(event) {
			//console.log($('#'+ event.currentTarget.id));
			var target = $('#' + event.currentTarget.id);
			var filtredStatuses;

			if (target.hasClass('ui-btn-active')) {
				target.removeClass('ui-btn-active');
				this.selectedDownloadManagertId = undefined;
				// No Download manager is selected so get the whole list of DARs
				this.orderedStatuses.orderedStatusesToDisplay = this.model.getOrderedStatuses();
				this.render();

			} else {

				this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
				target.addClass('ui-btn-active');
				this.selectedDownloadManagertId = event.currentTarget.id;
				//set up the list of DARs according to the selected Download manager
				this.orderedStatuses.orderedStatusesToDisplay = this.model.getFilterOrderedStatuses(this.selectedDownloadManagertId);
				//the update view method is used rather than render method in order to keep the status of the download manager
				//selected in the list and just update the list and not all the view.
				this.updateView();
			}
		}
	},

	/**
	 *	Update footer buttons enabled/disabled layout according to dar statuses
	 */
	updateFooterButtonsState: function() {
		// Update global disabled/enabled state
		if ( this.$el.find('.ui-icon-checkbox-on').length == 0 ) {
			this.$el.find("#darFooterButtons").addClass("ui-disabled");
		} else {
			this.$el.find("#darFooterButtons").removeClass("ui-disabled");
		}

		// Update each button state depending on checked dars
		var checkedDars = this.$el.find('.ui-icon-checkbox-on').next('.darStatus');
		var enableStop = _.find(checkedDars, function(dar) {
			return $(dar).data("DAR").status == validStatusesConfig.inProgressStatus.value || $(dar).data("DAR").status == validStatusesConfig.pausedStatus.value;
		});
		var enablePause = _.find(checkedDars, function(dar) {
			return $(dar).data("DAR").status == validStatusesConfig.inProgressStatus.value;
		});
		var enableResume = _.find(checkedDars, function(dar) {
			return $(dar).data("DAR").status == validStatusesConfig.pausedStatus.value;
		});
		var enableReassign = _.find(checkedDars, function(dar) {
			return $(dar).data("DAR").status != validStatusesConfig.completedStatus.value;
		});
		this.$el.find('#stopAll').button(enableStop ? 'enable' : 'disable').button('refresh');
		this.$el.find('#resumeAll').button(enableResume ? 'enable' : 'disable').button('refresh');
		this.$el.find('#pauseAll').button(enablePause ? 'enable' : 'disable').button('refresh');
		this.$el.find('#reassignDM').button(enableReassign ? 'enable' : 'disable').button('refresh');
	},

	/**
	 * Call back method called after a DAR status change response received from the server.  
	 * The method changes the DAR icon and the status of the buttons according to the new changed status of the DAR
	 */
	updateStatus: function(darStatus, message) {
		var darDiv = $("#darsDiv div[id='" + darStatus.ID + "']");

		// Update download manager id
		darDiv.find("tbody tr:eq(0) td:eq(2)").html(darStatus.dlManagerId);

		var messageEltId = "#serverDARMonitoringResponse_" + darStatus.ID;
		this.showMessage("Status changed to " + this.model.getStatusReadableString(darStatus.status) + " : " + message, messageEltId);

		var collapsibleHeader = darDiv.find(".ui-btn-inner:eq(0)");
		var pauseButton = darDiv.find("button[id='pause_" + darStatus.ID + "']");
		var stopButton = darDiv.find("button[id='stop_" + darStatus.ID + "']");

		// Update status and icon
		switch (darStatus.status) {

			case validStatusesConfig.inProgressStatus.value:
				// Cancelled or Paused -> InProgress
				collapsibleHeader.find(".statusIcon").removeClass("ui-icon-cancelled ui-icon-paused").addClass("ui-icon-processing");
				pauseButton.html("Pause").button('enable').button("refresh");
				stopButton.button('enable');
				darDiv.find("tbody tr:eq(0) td:eq(1)").html(validStatusesConfig.inProgressStatus.status);
				break;

			case validStatusesConfig.pausedStatus.value:
				// Cancelled or InProgress -> Paused
				collapsibleHeader.find(".statusIcon").removeClass("ui-icon-cancelled ui-icon-processing").addClass("ui-icon-paused");
				pauseButton.html("Resume").button('enable').button("refresh");
				stopButton.button('enable');
				darDiv.find("tbody tr:eq(0) td:eq(1)").html(validStatusesConfig.pausedStatus.status);
				break;

			case validStatusesConfig.cancelledStatus.value:
				// InProgress or Paused -> Cancelled
				collapsibleHeader.find(".statusIcon").removeClass("ui-icon-processing ui-icon-paused").addClass("ui-icon-cancelled");
				pauseButton.button('disable');
				stopButton.button('disable');
				darDiv.find("tbody tr:eq(0) td:eq(1)").html(validStatusesConfig.cancelledStatus.status);
				break;
			default: // Unknown status
				collapsibleHeader.find(".statusIcon").removeClass('ui-icon-processing ui-icon-paused ui-icon-cancelled').addClass('ui-icon-unknown');
				pauseButton.button('disable');
				stopButton.button('disable');
				darDiv.find("tbody tr:eq(0) td:eq(1)").html("unknown");
				break;
		}
		this.$el.find("#dmsDiv").html(darFilter_template(this.model)).trigger("create");
		this.updateFooterButtonsState();
	},

	/** 
	 * Display a notification message inside the given elementId
	 */
	showMessage: function(message, elementId) {
		if (timeouts[elementId]) {
			clearTimeout(timeouts[elementId]);
		}
		$(elementId)
			.empty()
			.append(message)
			.slideDown();

		// Hide status message after a given time
		timeouts[elementId] = setTimeout(function() {
			$(elementId).slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
	},

	/** 
	 * Update the list of selected data access statuses when a download manager has been selected.
	 */
	updateView: function() {
		//this.$el.find("#dmsDiv").html(darFilter_template(this.model));
		var darsContent = DAR_monitoring_template(this.orderedStatuses);
		this.$el.find("#darsDiv").html(darsContent);
		this.$el.trigger('create');
		this.setUpStatusIcons();
	},

	/**
	 *	Error callback
	 */
	error: function(model, xhr) {
		if (xhr.status == 404) {
			// This is normal, the user has no download managers so just render it.
			this.render();
		} else {
			this.$el.empty();
			this.$el.append("<div class='ui-error-message'><p><b> Failure: Error when loading the data access requests.</p></b>" +
				"<p><b> Please check the interface with the server.</p></b></div>");
		}
	},

	/**
	 * Refresh the view size
	 * Update dar list to have a good max height
	 */
	refreshSize: function() {
		var parentOffset = this.$el.offset();
		var $content = this.$el.find('#darsDiv');

		var height = $(window).height() - (parentOffset.top + this.$el.outerHeight()) + $content.height();

		$content.css('max-height', height);
	},

	/** 
	 * Display the list of DMs assigned to Data Access Requests in the left side and the list of 
	 * Data access request in the right side.
	 * By default all the DARS are displayed.
	 */
	render: function() {

		//orderedStatuses is the model for the monitoring view, it wrappes the DataAccessRequestStatuses model
		//and the orderedStatusesToDisplay which the array of the DARs to be displayed.
		//It is useful to update the orderedStatusesToDisplay according the DM selected.
		this.orderedStatuses = {
			orderedStatusesToDisplay: this.model.getOrderedStatuses(),
			model: this.model
		};

		var mainContent = accountDARs_template(this.model);
		this.$el.html(mainContent);

		this.$el.find("#dmsDiv").html(darFilter_template(this.model));

		var darsContent = DAR_monitoring_template(this.orderedStatuses);
		// var darsWidth = $('#darsDiv').width();
		// var slidingContent = '<div style="transition: all 0.2s; width: '+ (darsWidth*2) +'px; white-space: nowrap;" id="slidingContent">\
		// 	<div id="statuses" style="float: left; width: '+ darsWidth +'px;" class="slidingStep">'+ darsContent +'</div>\
		// 	<div id="dmSelection" style="float: left; width: '+ darsWidth +'px;" class="slidingStep">' + reassingDownloadPopup_template( DownloadManagers.attributes ) +'</div>\
		// </div>';
		this.$el.find("#darsDiv").html(darsContent);
		this.$el.trigger('create');
		this.setUpStatusIcons();
		this.refreshSize();
		return this;
	},

	/**
	 * Assign the correct status icon and update the buttons status for each data access request 
	 * depending on the DAR status.
	 */
	setUpStatusIcons: function() {

		var self = this;

		_.each(this.orderedStatuses.orderedStatusesToDisplay, function(orderedStatus) {
			_.each(orderedStatus.DARs, function(darStatus, i) {

				// Select the DAR element
				var selector = "div[id='" + darStatus.ID + "']";
				//					console.log("selector");
				//					console.log(selector);	
				var darDiv = $("#darsDiv").find(selector).data("DAR", darStatus);
				var collapsibleHeader = darDiv.find(".ui-btn-inner:eq(0)");
				var pauseButton = darDiv.find("button[id='pause_" + darStatus.ID + "']");
				var stopButton = darDiv.find("button[id='stop_" + darStatus.ID + "']");
				//					console.log(collapsibleHeader);
				//					console.log($(collapsibleHeader).find(".ui-btn-inner"));

				switch (darStatus.status) {

					// Processing
					case validStatusesConfig.inProgressStatus.value:
						collapsibleHeader.append('<span class="statusIcon ui-icon-processing ui-icon .ui-shadow">&nbsp;</span>');
						break;

						// Paused 
					case validStatusesConfig.pausedStatus.value:
						collapsibleHeader.append('<span class="statusIcon ui-icon-paused ui-icon .ui-shadow">&nbsp;</span>');
						pauseButton.html("Resume").button("refresh");
						break;

						// Completed
					case validStatusesConfig.completedStatus.value:
						collapsibleHeader.append('<span class="statusIcon ui-icon-completed ui-icon .ui-shadow">&nbsp;</span>');
						pauseButton.button('disable');
						stopButton.button('disable');
						break;

						// Cancelled
					case validStatusesConfig.cancelledStatus.value:
						collapsibleHeader.append('<span class="statusIcon ui-icon-cancelled ui-icon .ui-shadow">&nbsp;</span>');
						pauseButton.button('disable');
						stopButton.button('disable');
						break;

						// Unknown Status
					default:
						collapsibleHeader.append('<span class="ui-icon-unknown ui-icon .ui-shadow">&nbsp;</span>');
						pauseButton.button('disable');
						stopButton.button('disable');
						break;
				}

			});
		});

	}

});

module.exports = DataAccessRequestMonitoringView;