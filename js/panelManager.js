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

// Hide the panel with animation, one function for each panel right now
var _hidePanelAnimated = {
	left: function() {
		_center.animate({
			left: 0
		}, _updateCenterCB);
		_panels.left.animate({
			left: -_panels.left.outerWidth()
		});
	},
	bottom: function() {
		_center.animate({
			bottom: 0
		}, _updateCenterCB);
		_panels.bottom.animate({
			bottom: -_panels.bottom.outerHeight()
		});	
		_panels.left.animate({
			bottom: 0
		});	
	}		
};

//Show the panel with animation, one function for each panel right now
var _showPanelAnimated = {
		left: function() {
			_center.animate({
				left: _panels.left.outerWidth()
			}, _updateCenterCB);			
			_panels.left.animate({
				left: 0
			});
		},
		bottom: function() {
			_center.animate({
				bottom: _panels.bottom.outerHeight()
			}, _updateCenterCB);
			_panels.bottom.animate({
				bottom: 0
			});	
			_panels.left.animate({
				bottom: _panels.bottom.outerHeight()
			});	
		}		

};

// Hide the panel without animation, one function for each panel right now
var _hidePanel = {
	left: function() {
		_center.css({
			left: 0
		});
		_updateCenterCB();
		_panels.left.css({
			left: -_panels.left.outerWidth()
		});
	},
	bottom: function() {
		_center.css({
			bottom: 0
		}, _updateCenterCB);
		_panels.bottom.css({
			bottom: -_panels.bottom.outerHeight()
		});	
		_panels.left.css({
			bottom: 0
		});	
	}		
};

//Show the panel with animation, one function for each panel right now
var _showPanel = {
		left: function() {
			_center.css({
				left: _panels.left.outerWidth()
			});			
			_panels.left.css({
				left: 0
			});
			_updateCenterCB();
		},
		bottom: function() {
			_center.css({
				bottom: _panels.bottom.outerHeight()
			});
			_panels.bottom.css({
				bottom: 0
			});	
			_panels.left.css({
				bottom: _panels.bottom.outerHeight()
			});
			_updateCenterCB();
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
	},
	
	/**
	 * Hide the panel manager : hide all panels
	 */
	hide: function() {
		_hidePanel.left();
		_hidePanel.bottom();
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
			_panels.left.css({
				bottom: _panels.bottom.outerHeight()
			});
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
					
					_hidePanelAnimated[position]();
					content.trigger('panel:hide');

				} else {
					
					activators[position].removeClass('toggle');
					contents[position].hide().trigger('panel:hide');
					content.show().trigger('panel:show');
					
					_showPanelAnimated[position]();

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
		
		_showPanel[opts.position]();
	}
};



});



