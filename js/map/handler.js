define(['map/map'], function(Map) {

// Base object for handler
// Take as input the implementation
var Handler = function(impl) {

	// Private variables
	var _previousHandler = null;
	
	/**
	 * Public interface
	 */	
	this.start = function(options) {
		_previousHandler = Map.handler;
		if ( _previousHandler ) {
			_previousHandler.stop();
		}
		Map.handler = this;
		
		impl.start(options);
	};
	
	this.stop = function() {
		impl.stop();
		
		Map.handler = null;
		if ( _previousHandler ) {
			_previousHandler.start();
			_previousHandler = null;
		}
	};
	
	// Copy other methods
	for ( var x in impl ) {
		if ( impl[x] instanceof Function && x != 'start' && x != 'stop' ) {
			this[x] = impl[x];
		}
	}
};

return Handler;

});
