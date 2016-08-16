var Configuration = require('configuration');
var CreateShopcartView = require('account/view/createShopcartView');
var RenameShopcartView = require('account/view/renameShopcartView');
var DuplicateShopcartView = require('account/view/duplicateShopcartView');
var ShopcartExportWidget = require('shopcart/widget/shopcartExportWidget');
var SharePopup = require('ui/sharePopup');
var shopcartManagerContent_template = require('account/template/shopcartManagerContent');

/**
 *	The model of this view is <ShopcartCollection>
 */
var ShopcartManagerView = Backbone.View.extend({

	initialize: function() {
		this.model.on("sync", this.render, this);
		this.model.on("error", this.error, this);
	},

	events: {
		// Called when shopcart has been checked
		'change input[name="shopcart"]': function(event) {
			var shopcart = this.model.get(event.currentTarget.id);
			shopcart.toggleSelected();
			this.updateButtonsState();
		},

		// Create shopcart
		'click #new_shp': function(event) {

			var createShopcartView = new CreateShopcartView({
				model: this.model,
				title: "New shopcart"
			});
			createShopcartView.render();
		},

		// Duplicate shopcart
		'click #duplicate_shp': function(event) {

			var duplicateShopcartView = new DuplicateShopcartView({
				model: this.model,
				title: "Duplicate shopcart"
			});
			duplicateShopcartView.render();
		},

		// Rename selected shopcarts
		'click #rename_shp': function(event) {
			var renameShopcartView = new RenameShopcartView({
				model: this.model,
				title: "Rename shopcart"
			});
			renameShopcartView.render();
		},

		// Share selected shopcart
		'click #share_shp': function(event) {
			SharePopup.open({
				url: Configuration.serverHostName + (window.location.pathname) + this.model.getShopcartSharedURL(),
				positionTo: '#share_shp'
			});

		},

		// Delete selected shopcarts
		'click #delete_shp': function(event) {
			var self = this;
			this.model.getSelected().forEach(function(shopcart) {
				shopcart.destroy()
					.done(function() {
						self.model.setShopcartSelection(shopcart, false);
						self.render();
					})
					.fail(function(xhr, textStatus, errorThrown) {
						self.showMessage(errorThrown);
					});
			});
		},

		// Export selected shopcart
		'click #export_shp': function(event) {			
			var shopcartExportWidget = new ShopcartExportWidget();
			shopcartExportWidget.open();
		}
	},

	/**
	 *	Update button state depending on number of selected shopcarts
	 *	We can't share/export multiple shopcarts in one action for now..
	 */
	updateButtonsState: function() {
		if ( this.$el.find('input:checked').length == 1 ) {
			this.$el.find('#share_shp').removeAttr('disabled').button('refresh');
			this.$el.find('#export_shp').removeAttr('disabled').button('refresh');
		} else {
			this.$el.find('#share_shp').attr('disabled', 'disabled').button("refresh");
			this.$el.find('#export_shp').attr('disabled', 'disabled').button("refresh");
		}
	},

	/**
	 * Refresh the view size
	 */
	refreshSize: function() {
		var parentOffset = this.$el.offset();
		var $content = this.$el.find('#shopcartListDiv');

		var height = $(window).height() - (parentOffset.top + this.$el.outerHeight()) + $content.height() - 50;

		$content.css('max-height', height);
	},

	/**
	 *	Render
	 */
	render: function() {
		var mainContent = shopcartManagerContent_template({
			shopcarts: this.model
		});
		this.$el.html(mainContent);

		this.$el.trigger("create");
		this.refreshSize();

		this.updateButtonsState();
		return this;
	},

	/** 
	 * Display the error message if any
	 */
	showMessage: function(message) {
		if (this.timeOut) {
			clearTimeout(this.timeOut);
		}

		$("#errorMessageDiv")
			.html(message)
			.slideDown();

		// Hide status message after a given time
		this.timeOut = setTimeout(function() {
			$("#errorMessageDiv").slideUp();
		}, Configuration.data.dataAccessRequestStatuses.messagefadeOutTime);
	},

	/**
	 * This is a callback method to display an error message when an error occurs during 
	 * shopcart list retrieving. 
	 */
	error: function() {
		this.$el.html("<div class='ui-error-message'><p><b> Failure: Error when loading the shopcart list.</p></b>" +
			"<p><b> Please check the interface with the server.</p></b></div>");
	}

});

module.exports = ShopcartManagerView;