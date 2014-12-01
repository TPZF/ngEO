define(['map/map'], function(Map) {

// Base object for handler
// Take as input the implementation
var Handler = function(impl) {

	// Private variables
	var _previousHandler = null;
	
	/**
	 * Public interface
	 */
	this.initialize = function(options) {
		if (impl.initialize)
			impl.initialize(options);
	};
	
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
};

return Handler;

});
