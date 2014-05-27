define(
		[ 'jquery', 'backbone'],
	function($, Backbone) {


var monthDay=["31","28","31","30","31","30","31","31","30","31","30","31"];

/**
 * A view to display a gantt chart.
 * The model contains a feature collection
 */
var GanttView = Backbone.View.extend({

	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize : function( options ) {
		this.scale = 'quarter-day';
	},
	
	id: 'ganttView',

	/**
	 * Manage events on the view
	 */
	events : {
		'change input[name=radio-time-scale]': function(event) {
			this.scale = event.currentTarget.value;
			if ( this.model.features.length > 0 ) {
				this.clear();
				this.addData( this.model.features );
			}
		}
	},
	
	/**
	 * Set the model on the gantt view
	 */
	setModel: function(model) {
		if ( this.model ) {
			this.stopListening(this.model);
		}
		
		this.model = model;
		
		if ( this.model ) {
			this.listenTo(this.model,"reset:features", this.clear);
			this.listenTo(this.model,"add:features", this.addData);
		}
	},
	
	/**
	 * Clear the gantt chart
	 */
	clear: function() {
		this.$el.find('.gantt-data-panel').detach();
		this.$el.append('<div class="gantt-data-panel"><div class="gantt-nodata">No data to display</div></div>');
	},

	/**
	 * Add data to gantt chart
	 */
	addData: function(features) {
			
		if ( features.length == 0 ) {
			return;
		}
		
		this.$el.find('.gantt-data-panel').empty();
	
		var minDate = features[0].properties.EarthObservation.gml_beginPosition;
		var maxDate = features[0].properties.EarthObservation.gml_endPosition;
		
		for ( var i = 1; i < features.length; i++ ) {
		
			if ( features[i].properties.EarthObservation.gml_beginPosition < minDate ) {
				minDate = features[i].properties.EarthObservation.gml_beginPosition;
			}
			
			if ( features[i].properties.EarthObservation.gml_endPosition > maxDate ) {
				maxDate = features[i].properties.EarthObservation.gml_endPosition;
			}
		}
		
		this.buildTable( Date.fromISOString(minDate), Date.fromISOString(maxDate), features.length  );
		
		for ( var i = 0; i < features.length; i++ ) {
			this.addBar( Date.fromISOString(features[i].properties.EarthObservation.gml_beginPosition), 
					Date.fromISOString(features[i].properties.EarthObservation.gml_endPosition), features[i].id );
		}

		this.$el.find('.gantt-body-scroll').scrollLeft( this.$el.find('table').width() );
	},
	
	/**
	 * Show the table
	 */
	show: function() {
		this.$el.show();
	},
	
	/**
	 * Hide the table
	 */
	hide: function() {
		this.$el.hide();
	},
	
	/**
	 * Build the day scale
	 */
	buildDayScale: function(start,end) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
		this.startDate = new Date( start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
		
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-20">');
		while ( date < end ) {
		
			$rowUp.append('<th colspan="'+ monthDay[date.getMonth()] +'">' + (date.getMonth()+1) + '/' + date.getFullYear() + '</th>');
			for ( var i = 0; i < monthDay[date.getMonth()]; i++ ) {
				$rowDown.append('<th>' + (i+1) + '</th>');
			}
			date = new Date( date.getTime() + monthDay[date.getMonth()] * 24 * 3600 * 1000 );
		}
		
		return $('<thead>').append($rowUp).append($rowDown);	
	},
	
	/**
	 * Build the quarter-day scale
	 */
	buildQuarterDayScale: function(start,end) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		this.startDate = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-60">');
		while ( date < end ) {
		
			$rowUp.append('<th colspan="4">' + date.toDateString() + '</th>');
			for ( var i = 0; i < 4; i++ ) {
				$rowDown.append('<th>' + i*6 + '-' + (i+1)*6 +'</th>');
			}
			date = new Date( date.getTime() + 24 * 3600 * 1000 );
		}
		
		return $('<thead>').append($rowUp).append($rowDown);	
	},
	
	/**
	 * Build the hour scale
	 */
	buildHourScale: function(start,end) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		this.startDate = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-20">');
		while ( date < end ) {
		
			$rowUp.append('<th colspan="24">' + date.toDateString() + '</th>');
			for ( var i = 0; i < 24; i++ ) {
				$rowDown.append('<th>' + i + '</th>');
			}
			date = new Date( date.getTime() + 24 * 3600 * 1000 );
		}
		
		return $('<thead>').append($rowUp).append($rowDown);	
	},
	
	/**
	 * Build the minute scale
	 */
	buildMinuteScale: function(start,end,step) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), start.getDate(), start.getHours() + (start.getTimezoneOffset() / 60), 0, 0, 0);
		var end2 = new Date( end.getFullYear(), end.getMonth(), end.getDate(), end.getHours() + (start.getTimezoneOffset() / 60), end.getMinutes(), end.getSeconds(), end.getMilliseconds());
		this.startDate = new Date( start.getFullYear(), start.getMonth(), start.getDate(), start.getHours() + (start.getTimezoneOffset() / 60), 0, 0, 0);
				
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-20">');
		while ( date < end2 ) {
		
			$rowUp.append('<th colspan="' + (60/step) + '">' + date.toISODateString() + ' ' + date.getHours() + 'h</th>');
			for ( var i = 0; i < 60; i+=step ) {
				$rowDown.append('<th>' + i + '</th>');
			}
			date = new Date( date.getTime() + 3600 * 1000 );
		}
		
		return $('<thead>').append($rowUp).append($rowDown);	
	},
	
	/**
	 * Get the position of a date in the gantt chart
	 * Depends of the chosen scale
	 */
	getPosition: function(date) {
		var diff = date - this.startDate + (date.getTimezoneOffset() * 60 * 1000);
		if ( this.scale == 'day' ) {
			return (21 * diff) / (3600*1000*24);
		}
		else if ( this.scale == 'quarter-day' ) {
			return (61 * diff) / (3600*1000*6);
		}
		else if ( this.scale == 'hour' ) {
			return (21 * diff) / (3600*1000);
		}
		else if ( this.scale == '10-minute' ) {
			return (21 * diff) / (600*1000);
		}
		else if ( this.scale == 'minute' ) {
			return (21 * diff) / (60*1000);
		}
	},
	
	/**
	 * Add a bar to the gantt chart
	 */
	addBar: function( start, end, id ) {
	
		var tooltip = "Id : " + id + "&#13;";
		tooltip += "Start : " + start.toISOString() + "&#13;";
		tooltip += "End  : " + end.toISOString();
		var $bar = $('<div title="' + tooltip +'" class="gantt-bar">');
		//var $table = this.$el.find('table');
		var hh = 34; //$table.find('thead').outerHeight();
		
		var s = this.getPosition(start);
		var e = this.getPosition(end);
		
		var numBars = this.$el.find('.gantt-body-scroll').children('.gantt-bar').length;
		$bar.css({ top: 1 + numBars * 21, left: s, width: e-s });
		
		this.$el.find('.gantt-body-scroll').append($bar);
	},
	
	/**
	 * Build the table : table is used to build headers, and to have grid on body
	 */
	buildTable: function( start, end, nbRows ) {
		var $headTable = $('<table cellspacing="0" cellpadding="0">');
		
		if ( this.scale == 'day' ) {
			$headTable.append( this.buildDayScale( start, end ) );
		}
		if ( this.scale == 'quarter-day' ) {
			$headTable.append( this.buildQuarterDayScale( start, end ) );
		}
		else if ( this.scale == 'hour' ) {
			$headTable.append( this.buildHourScale( start, end ) );
		}
		else if ( this.scale == '10-minute' ) {
			$headTable.append( this.buildMinuteScale( start, end, 10 ) );
		}
		else if ( this.scale == 'minute' ) {
			$headTable.append( this.buildMinuteScale( start, end, 1 ) );
		}
		
		var nbCells = $headTable.find('thead tr:last-child').children().length;
		
		if ( nbCells > 1000 ) {
			this.$el.append('<div class="gantt-data-panel"><div class="gantt-nodata">Cannot display data for the selected time scale : ' + nbCells +' steps needed.</div></div>');
			return;
		}
			
		// Build rows for table
		var $bodyTable = $('<table cellspacing="0" cellpadding="0">');
		
		var rowStr = '<tr';
		if ( this.scale == 'quarter-day' ) {
			rowStr += ' class="gantt-body-60"';
		}
		rowStr += '>';
		for ( var j = 0; j < nbCells; j++ ) {
			rowStr +='<td></td>';
		}
		rowStr += '</tr>';
	
		var tbodyStr = '<table cellspacing="0" cellpadding="0"><tbody>';
		for ( var i = 0; i < nbRows; i++ ) {			
			tbodyStr += rowStr;
		}
		tbodyStr += '</tbody></table>';
		
		var $headTable = $('<div class="gantt-head-scroll">').append($headTable);
		
		this.$el.find('.gantt-data-panel')
			.append( $headTable )
			.append( '<div class="gantt-body-scroll">' + tbodyStr + '</div>' );
			
		
		//var diffWidth = this.$el.find('.gantt-head-scroll table').width() - this.$el.find('.gantt-body-scroll table').width();
			
		var $head = this.$el.find('.gantt-head-scroll');
		this.$el.find('.gantt-body-scroll').scroll( function(event) {
			$head.scrollLeft( $(this).scrollLeft() );
		});
	
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		this.$el.addClass('gantt-view');
		this.$el.append('<div class="gantt-left-panel">\
		<fieldset data-role="controlgroup" data-mini="true">\
				<legend>Time scale:</legend>\
					<label>Minute<input type="radio" name="radio-time-scale" value="minute" /></label>\
					<label>10 minute<input type="radio" name="radio-time-scale" value="10-minute" /></label>\
					<label>Hour<input type="radio" name="radio-time-scale" value="hour" /></label>\
					<label>Quarter day<input type="radio" name="radio-time-scale" value="quarter-day" checked="checked" /></label>\
					<label>Day<input type="radio" name="radio-time-scale" value="day" /></label>\
		</fieldset></div>');
		
		this.clear();
		
		this.$el.trigger('create');
		
	}
	
});

return GanttView;

});