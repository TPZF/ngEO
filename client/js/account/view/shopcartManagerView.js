var Configuration = require('configuration');
var CreateShopcartView = require('account/view/createShopcartView');
var RenameShopcartView = require('account/view/renameShopcartView');
var DuplicateShopcartView = require('account/view/duplicateShopcartView');
var ShopcartExportWidget = require('shopcart/widget/shopcartExportWidget');
var SharePopup = require('ui/sharePopup');
var shopcartManagerContent_template = require('account/template/shopcartManagerContent');

var ShopcartManagerView = Backbone.View.extend({

	initialize: function () {
		this.model.on("sync", this.render, this);
		this.model.on("error", this.error, this);
	},

	events: {
		'click label': function (event) {
			this.model.setCurrent(this.model.get(event.currentTarget.id));
		},

		'click #new_shp': function (event) {

			var createShopcartView = new CreateShopcartView({
				model: this.model,
				title: "New shopcart"
			});
			createShopcartView.render();
		},

		'click #duplicate_shp': function (event) {

			var duplicateShopcartView = new DuplicateShopcartView({
				model: this.model,
				title: "Duplicate shopcart"
			});
			duplicateShopcartView.render();
		},

		'click #rename_shp': function (event) {

			var renameShopcartView = new RenameShopcartView({
				model: this.model,
				title: "Rename shopcart"
			});
			renameShopcartView.render();
		},

		//called when the share button is clicked.
		//NGEOL-60: To Hide Sharing shopcart
		/*'click #share_shp': function (event) {

			SharePopup.open({
				url: Configuration.serverHostName + (window.location.pathname) + this.model.getShopcartSharedURL(),
				positionTo: '#share_shp'
			});

		},*/

		'click #delete_shp': function (event) {
			var self = this;
			this.model.getCurrent().destroy()
				.done(function () {
					if (self.model.length > 0) {
						self.model.setCurrent(self.model.at(0));
					} else {
						self.model.setCurrent(null);
					}
					self.render();
				})
				.fail(function(xhr, textStatus, errorThrown) {
					self.showMessage(errorThrown);
				});
		},
		//added export as in the shopcart item view
		'click #export_shp': function(event) {

			var shopcartExportWidget = new ShopcartExportWidget();
			shopcartExportWidget.open();
		}
	},

	/**
	 * Refresh the view size
	 */
	refreshSize: function () {
		var parentOffset = this.$el.offset();
		var $content = this.$el.find('#shopcartListDiv');

		var height = $(window).height() - (parentOffset.top + this.$el.outerHeight()) + $content.height() - 50;

		$content.css('max-height', height);
	},

	render: function () {
		var mainContent = shopcartManagerContent_template({
			shopcarts: this.model
		});
		this.$el.html(mainContent);

		// Select the current one
		if (this.model.getCurrent()) {
			var currentShopcartSelect = "#" + this.model.getCurrent().id + "_input";
			this.$el.find(currentShopcartSelect).attr('checked', true);
		}

		this.$el.trigger("create");

		this.refreshSize();

		return this;
	},

	/** display the error message if any */
	showMessage: function (message) {
		if (this.timeOut) {
			clearTimeout(this.timeOut);
		}

		$("#errorMessageDiv")
			.html(message)
			.slideDown();

		// Hide status message after a given time
		this.timeOut = setTimeout(function () {
			$("#errorMessageDiv").slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
	},

	/**
	 * this is a callback method to display an error message when an error occurs during 
	 * shopcart list retrieving. 
	 */
	error: function () {
		this.$el.html("<div class='ui-error-message'><p><b> Failure: Error when loading the shopcart list.</p></b>" +
			"<p><b> Please check the interface with the server.</p></b></div>");
	}

});

module.exports = ShopcartManagerView;