/**
  * PanelManager module
  */

define( [ "jquery" ], 

// The function to define the Panel module
function($) {

// the center element
var _center;

// A callback to call when the center has been updated, i.e. some panels has been shown/hidden
var _updateCenterCB;

var _bottomFix = true;

// the panel
var _panels = {
	left: $(),
	bottom: $()
}

// The different content possible on panels
var contents = {
	left: $(),
	bottom: $()
};
var activators = {
	left: $(),
	bottom: $()
};

// Build a panel according to its position
var _buildPanel = function(opts,position) {
	if (!opts[position])
		return;
	
	var panel = _panels[position] = $(opts[position]);
	
	//panel.hide();
	
	
	// Build the 'toolbar'
	panel
		.find('.toolbar')
		.find('img')
		.wrap('<div class="tb-elt" />')
		.addClass('tb-button')
		.each( function(index) {
			$(this).after('<div class="tb-text">' + $(this).attr('name') + '</div>');
		});
	
	// Set initial position
	switch (position)
	{
	case "left":
		panel.css('left',-panel.outerWidth());
		break;
	case "bottom":
		panel.css('bottom',-panel.outerHeight());
		break;
	}

	panel
		.find('.toolbar').addClass('panel-toolbar-' + position).appendTo(_center);
};

var _leftSizeChanged = function() {
	contents.left.trigger('panel:sizeChanged');
};

var _bottomSizeChanged = function() {
	contents.bottom.trigger('panel:sizeChanged');
};

// Hide the panel with animation, one function for each panel right now
var _hidePanel = {
	left: function(duration) {
		var d = duration || 0;
		_center.animate({
			left: 0
		}, d, _updateCenterCB);
		_panels.left.animate({
			left: -_panels.left.outerWidth()
		}, d);
		if (!_bottomFix) {
			_panels.bottom.animate({
				left: 0
			}, d, _bottomSizeChanged);
		}
	},
	bottom: function(duration) {
		var d = duration || 0;
		_center.animate({
			bottom: 0
		}, d, _updateCenterCB);
		_panels.bottom.animate({
			bottom: -_panels.bottom.outerHeight()
		}, d);	
		if (_bottomFix) {
			_panels.left.animate({
				bottom: 0
			}, d, _leftSizeChanged);
		}
	}		
};

//Show the panel with animation, one function for each panel right now
var _showPanel = {
		left: function(d) {
			_center.animate({
				left: _panels.left.outerWidth()
			}, d, _updateCenterCB);			
			_panels.left.animate({
				left: 0
			}, d);
			if (!_bottomFix) {
				_panels.bottom.animate({
					left: _panels.left.outerWidth()
				}, d, _bottomSizeChanged);
			}
		},
		bottom: function(d) {
			_center.animate({
				bottom: _panels.bottom.outerHeight()
			}, d, _updateCenterCB);
			_panels.bottom.animate({
				bottom: 0,
			}, d);
			if (_bottomFix) {
				_panels.left.animate({
					bottom: _panels.bottom.outerHeight()
				}, d, _leftSizeChanged);
			}
		}		

};

// Restore panel
var _restorePanel = function(self,pos) {
	activators[pos].each(function(i, elt){
		if ( $(this).hasClass('toggle') ){
			self.showPanel({ 
				position: pos, 
				activator: this 
			});
		}
	});
};


return {
	
	/**
	 * Initialize the module
	 */
	initialize: function(opts) {
		_center = $(opts.center);
		_updateCenterCB = opts.updateCenter;
		_buildPanel(opts,'left');
		_buildPanel(opts,'bottom');
		
		$(window).resize(_leftSizeChanged);
		$(window).resize(_bottomSizeChanged);
	},
	
	/**
	 * Hide the panel manager : hide all panels
	 */
	hide: function() {
		_hidePanel.left(0);
		_hidePanel.bottom(0);
	},
	
	/**
	 * Show the panel manager
	 */
	show: function() {
		_restorePanel(this,'left');
		_restorePanel(this,'bottom');
	},	
	
	/**
	 * Update the panel size
	 */
	updatePanelSize: function(pos) {
		switch (pos)
		{
		case 'bottom':
			_center.css({
				bottom: _panels.bottom.outerHeight()
			}, _updateCenterCB);
			if ( _bottomFix ) {
				_panels.left.css({
					bottom: _panels.bottom.outerHeight()
				});
			}
			break;
		}
	},

	/**
	 *  Add the content of a panel
	 * @param opts
	 */
	addPanelContent: function(opts) {
		
		var position = opts.position;
		if (!position)
			return;
		
		var content = opts.element.appendTo( _panels[position] );
		content.hide();
		content.addClass('ui-body-c panel-content-' + position);
		content.trigger('create');
		
		var $activator = $(opts.activator);
		contents[position] = contents[position].add(content);
		activators[position] = activators[position].add( $activator );
	
		$activator
			.data('content', content)
			.click( function() {
				if ( $(this).hasClass('toggle') ) {
					
					_hidePanel[position](300);
					content.trigger('panel:hide');

				} else {
					
					activators[position].removeClass('toggle');
					contents[position].hide().trigger('panel:hide');
					content.show().trigger('panel:show');
					
					_showPanel[position](300);

				}
				$(this).toggleClass('toggle');
		});
	}, 
	
	/**
	 * Show a panel.
	 * Params : the position (left or bottom) and the content to display, given by its activator
	 */
	showPanel: function(opts) {
		contents[opts.position].hide().trigger('panel:hide');
		
		var $content = $(opts.activator).data('content');
		$content.show().trigger('panel:show');
		
		_showPanel[opts.position](0);
	}
};



});



