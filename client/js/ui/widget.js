/**
 * An element to block user interactions when opening a modal pop-up
 */
var modalScreen = $('<div class="ui-popup-screen ui-overlay-a ui-screen-hidden"></div>').appendTo('.ui-page-active');

$._ngeoOpenedWidgets = [];

$.widget("ngeo.ngeowidget", {

	// default options
	options: {
		title: "",
		activator: null,
		effectDuration: 1000,
		modal: true,
		closable: true,

		// callbacks
		show: null,
		hide: null
	},

	// the constructor
	_create: function() {

		var self = this;

		// Style the container
		this.element.addClass("widget-content");
		// Use jQM to style the content
		this.element.addClass("ui-body-c");

		// Wrap with the parent div for widget
		this.element.wrap("<div class='widget'/>");
		this.parentElement = this.element.parent();

		if (this.options.title) {
			this.parentElement.prepend('<h2>' + this.options.title + '</h2>');
		}

		// Activator
		if (this.options.activator) {
			this.activator = $(this.options.activator);
			this.activator.click(function() {
				if (self.activator.hasClass('toggle')) {
					self.hide();
				} else {
					self.show();
				}
			});
		} else if (this.options.closable) {
			$('<a class="ui-btn-right" data-iconpos="notext" data-icon="delete" data-theme="a"\
				data-role="button" data-corners="true" data-shadow="true"\
				data-iconshadow="true" data-wrapperels="span" title="Close">')
				.prependTo(this.parentElement)
				.click($.proxy(this.hide, this));
		}

		this.parentElement
			.trigger("create")
			.hide();

		if (this.activator) {
			// Add Arrow
			this.arrow = $("<div class='widget-arrow-up' />")
				.insertBefore(this.parentElement);
			this.arrow.hide();
		}
		$._ngeoOpenedWidgets.push(this);
	},

	update: function() {
		var $tb = $('#mapToolbar');
		var toolbarBottom = $tb.position().top + $tb.outerHeight();
		if (this.activator) {
			// Recompute position for widget
			var posActivator = this.activator.offset();
			var widgetLeft = Math.max(10, posActivator.left - (this.parentElement.outerWidth() / 2) + (this.activator.outerWidth() / 2));
			this.parentElement
				.css('left', widgetLeft);
			this.arrow
				.css('left', posActivator.left);

			// Set top position for both arrow and widget content
			// Top position never changed because toolbar and activator are fixed... even with a window resize!
			this.parentElement
				.css('top', toolbarBottom + this.arrow.outerHeight());
			this.arrow
				.css('top', toolbarBottom);
		} else {
			var widgetLeft = this.options.left || ($(window).width() / 2 - (this.parentElement.outerWidth() / 2));
			var widgetTop = this.options.top || (($(window).height() - toolbarBottom) / 2 - (this.parentElement.outerHeight() / 2));
			this.parentElement.css({
				top: widgetTop,
				left: widgetLeft
			});
		}
	},

	show: function() {
		// Automatically hide other popup
		for (var i = 0; i < $._ngeoOpenedWidgets.length; i++) {
			if ($._ngeoOpenedWidgets[i] != this) {
				$._ngeoOpenedWidgets[i].hide();
			}
		}

		this.update();
		this.parentElement.fadeIn(this.options.durationEffect);
		if (this.arrow) this.arrow.fadeIn(this.options.durationEffect);

		if (this.activator) {
			this.activator.addClass('toggle');
		} else if (this.options.modal) {
			modalScreen.removeClass('ui-screen-hidden');
			modalScreen.addClass('in');
		}

		if (this.options.show) {
			this.options.show();
		}
	},

	hide: function() {
		this.parentElement.fadeOut(this.options.durationEffect, this.options.hide);
		if (this.arrow) this.arrow.fadeOut(this.options.durationEffect);
		if (this.activator) {
			this.activator.removeClass('toggle');
		} else if (this.options.modal) {
			modalScreen.addClass('ui-screen-hidden');
			modalScreen.removeClass('in');
		}
	},

	// events bound via _bind are removed automatically
	// revert other modifications here
	_destroy: function() {
		// Remove from widgets array
		var index = $._ngeoOpenedWidgets.indexOf(this);
		if (index >= 0) {
			$._ngeoOpenedWidgets.splice($._ngeoOpenedWidgets.indexOf(this), 1);
		}
		// Cleanup parent element
		this.parentElement.children().not(this.element).remove();
		// Remove parent element
		this.element.unwrap();
		//Remove arrow
		if (this.arrow) this.arrow.remove();
	},

	// _setOptions is called with a hash of all options that are changing
	// always refresh when changing options
	_setOptions: function() {
		// in 1.9 would use _superApply
		$.Widget.prototype._setOptions.apply(this, arguments);
		// TODO : refresh?
	},

	// _setOption is called for each individual option that is changing
	_setOption: function(key, value) {
		// TODO : manage options?
		// in 1.9 would use _super
		$.Widget.prototype._setOption.call(this, key, value);
	}
});