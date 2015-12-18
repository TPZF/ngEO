var Configuration = require('configuration');
var DownloadManagers = require('dataAccess/model/downloadManagers');
var downloadManagersMonitoring_template = require('account/template/downloadManagersMonitoringContent');
var downloadManagerInstall_template = require('dataAccess/template/downloadManagerInstallContent');
var downloadManagersList_template = require('account/template/downloadManagersTableContent');
var ngeoWidget = require('ui/widget');

var DownloadManagersMonitoringView = Backbone.View.extend({

	initialize: function() {
		this.model.on("sync", this.buildDownloadManagersTable, this);
		this.model.on("status:change", this.buildDownloadManagersTable, this);
		this.model.on("error", this.error, this);
	},

	events: {

		// Call when user clicks on a a button
		'click #stop_dm': function(event) {
			this.$stopDialog.ngeowidget('show');
		},

		'click tbody tr': function(event) {
			// Allow a unique row selection
			$("tr").removeClass('dm_selected');
			$(event.currentTarget).toggleClass('dm_selected');
			// Each row id follows this expression: row_id where id is the related download manager id
			var dmID = $(event.currentTarget).attr('data-dmId');
			var status = this.model.getDownloadManagerStatus(dmID);

			if (status == "ACTIVE" || status == "INACTIVE") {
				$("#stop_dm").button('enable');
			} else {
				$("#stop_dm").button('disable');
			}
		}
	},

	/**
	 * Call when an error occurs on the server
	 */
	error: function(model, xhr) {
		if (xhr.status == 404) {
			// This is normal, the user has no download managers so just render it.
			this.render();
		} else {
			this.$el.empty();
			this.$el.append("<div class='ui-error-message'><p><b> Failure: Error when loading the download managers.</p></b>" +
				"<p><b> Please check the interface with the server.</p></b></div>");
		}
	},

	/**
	 * Refresh the view size
	 * Update download manager list to have a good max height
	 */
	refreshSize: function() {
		var parentOffset = this.$el.offset();
		var $content = this.$el.find('#downloadManagersMonitoringContent');

		var height = $(window).height() - (parentOffset.top + this.$el.outerHeight()) + $content.height() - 50;

		$content.css('max-height', height);
	},

	listTemplate: downloadManagersList_template,

	buildDownloadManagersTable: function() {
		if (this.model.get('downloadmanagers').length > 0) {
			this.$el.find('#downloadManagersMonitoringContent').html(this.listTemplate(this.model.attributes));
		} else {
			this.$el.find('#downloadManagersMonitoringContent').html("<p class='ui-error-message'><b>No download managers have been registered.</b></p>");
		}
		this.$el.trigger('create');
	},

	/**
	 * Call to build the view when the download managers are synced
	 */
	render: function() {

		this.$el.empty();

		// Add HTML to install a download manager
		var installContent = downloadManagerInstall_template({
			downloadManagerInstallationLink: Configuration.data.downloadManager.downloadManagerInstallationLink,
			downloadmanagers: this.model.get('downloadmanagers')
		});
		this.$el.append(installContent);

		this.$el.append(downloadManagersMonitoring_template());

		this.buildDownloadManagersTable();

		$("#stop_dm").button('disable');

		this.$stopDialog = this.$el.find('#stopDMDialog')
			.appendTo('.ui-page-active')
			.ngeowidget({
				title: "Stop Immediately?",
				closable: false
			});
		this.$stopDialog.ngeowidget('hide');

		var self = this;
		this.$stopDialog.find('button').click(function(event) {
			var dmID = $('tr.dm_selected').attr('data-dmId');
			self.$stopDialog.ngeowidget('hide');
			var command = $(this).attr('name');
			self.model.requestChangeStatus(dmID, command);
			$("#stop_dm").button('disable');
		});

		this.refreshSize();

		return this;
	},
});

module.exports = DownloadManagersMonitoringView;