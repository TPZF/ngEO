/**
 * Toolbar module
 */

require('ui/widget');

// The function to define the Widget module
$.widget("ngeo.toolbar", {
	// default options
	options: {
		onlyIcon: false,
		withNumber: false,
		large: false	// Large button option (actually used for bottom panel)
	},

	// the constructor
	_create: function() {

		this._build(this.element.find('command'));

		if (this.options.onlyIcon) {
			this.element.find('.tb-separator').css({
				height: '24px'
			});
		}

	},

	// build some elements
	_build: function(elements) {

		if ( this.options.large ) {

			// Large buttons in bottom panel
			// TODO: create dedicated module
			elements.addClass('tb-elt');

			if ( $(this).data('notext') ) {

			} else {
				$('<div>\
				   </div>').appendTo(elements);
				
			}

			elements.each(function() {
				if ( $(this).data('notext') ) {
					$(this).append('<div class="tb-button"><div class="tb-icon"></div></div>');
					$(this).attr('title', $(this).attr('label'));
				} else {
					$(this).append('<div class="tb-large-button">\
							   			<div class="btnHeader"><span class="datasetName">'+$(this).attr('label')+'</span></div>\
					   					<div class="btnFooter"><span class="layerVisibility ui-icon ui-icon-checkbox-on"></span><span class="nbFeatures">No search done</span></div>\
				   					</div>');
					if ( $(this).data('icon') ) {
						$(this).find('.btnHeader').prepend('<img class="datasetTypeIcon" src="../images/'+$(this).data('icon')+'.png" />');
					}
				}
			});

		} else {
			// Wrap the image with a div to display both image and text below, and then add class for button styling
			elements
				.addClass('tb-elt');

			// Add text for each element
			var $tbButton = $('<div class="tb-button"><div class="tb-icon"></div></div>').appendTo(elements);

			if ( this.options.withNumber ) {
				$tbButton.find('.tb-icon').append('<span class="nbFeatures"></span>');
			}

			// Take care to set the data-help on the tb-icon (now the element to receive click)
			elements.each(function() {
				var $this = $(this);
				var contextHelp = $this.data('help');
				if (contextHelp) {
					// Add it the current element
					$this.attr('data-help', contextHelp);

					// OLD code to store data-help on tb-icon, discarded by NGEO-2003
					// Add it to the lowest element
					// $this.find('.tb-icon').attr('data-help', contextHelp);
					// Remove it from the container, not needed anymore
					// $this.removeAttr('data-help');
				}
			});

			if (this.options.onlyIcon) {
				elements.attr('title', function() {
					return $(this).attr('label');
				});
			} else {
				var self = this;
				elements.append(function() {
					var $elt;
					// Even if globally toolbar have labels, some elements still could be without label
					// Ex: "Table" .. check if data-notext exist and add title only
					if ( $(this).data('notext') ) {
						$(this).attr('title', $(this).attr('label'));
					} else {
						$elt = $('<div class="tb-text"> ' + $(this).attr('label') + '</div>');
					}
					return $elt;
				});
			}
		}

	},

	// refresh the toolbar
	refresh: function() {

		this._build(this.element.find('command:not(.tb-elt)'));

	},

	// events bound via _bind are removed automatically
	// revert other modifications here
	_destroy: function() {
		// TODO
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