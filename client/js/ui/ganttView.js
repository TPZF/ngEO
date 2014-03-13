define(
		[ 'jquery', 'backbone', 'jquery-gantt'],
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
	},
	
	id: 'ganttView',

	/**
	 * Manage events on the view
	 */
	events : {
	
	},
	
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
		this.$el.find('.gantt-bar').remove();
	},

	/**
	 * Add data to gantt chart
	 */
	addData: function(features) {
	
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
		
		this.$el.find('table').remove();
		this.buildTable( Date.fromISOString(minDate), Date.fromISOString(maxDate), features.length  );
		
		for ( var i = 0; i < features.length; i++ ) {
			this.addBar( Date.fromISOString(features[i].properties.EarthObservation.gml_beginPosition), Date.fromISOString(features[i].properties.EarthObservation.gml_endPosition) );
		}

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
	
	buildMonthScale: function(start,end) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), 0, 0, 0, 0, 0);
		this.startDate = new Date( start.getFullYear(), start.getMonth(), 0, 0, 0, 0, 0);
		
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-down">');
		while ( date < end ) {
		
			$rowUp.append('<th colspan="'+ monthDay[date.getMonth()] +'">' + (date.getMonth()+1) + '/' + date.getFullYear() + '</th>');
			for ( var i = 0; i < monthDay[date.getMonth()]; i++ ) {
				$rowDown.append('<th>' + (i+1) + '</th>');
			}
			date = new Date( date.getTime() + monthDay[date.getMonth()] * 24 * 3600 * 1000 );
		}
		
		return $('<thead>').append($rowUp).append($rowDown);	
	},
	
	buildDayScale: function(start,end) {
		
		var date = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		this.startDate = new Date( start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
		
		var $rowUp = $('<tr>');
		var $rowDown = $('<tr class="gantt-head-down">');
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
	 * Add a bar to the gantt chart
	 */
	addBar: function( start, end ) {
	
		var $bar = $('<div class="gantt-bar">');
		var $table = this.$el.find('table');
		var hh = $table.find('thead').outerHeight();
		
		var diffS = start - this.startDate;
		var s = (21 * diffS) / (3600*1000);
		
		var diffE = end - this.startDate;
		var e = (21 * diffE) / (3600*1000);
		
		var numBars = this.$el.find('.gantt-data-panel').children('.gantt-bar').length;
		$bar.css({ top: hh + 2 + numBars * 21, left: s, width: e-s });
		
		this.$el.find('.gantt-data-panel').append($bar);
	},
	
	buildTable: function( start, end, nbRows ) {
		var $table = $('<table cellspacing="0" cellpadding="0">');
		$table.append( this.buildDayScale( start, end ) );
			
		// Build rows for table
		var $tbody = $('<tbody>');
		for ( var i = 0; i < nbRows; i++ ) {
		
			var $row =  $('<tr>');
			var nbCells = $table.find('.gantt-head-down').children().length;
			for ( var j = 0; j < nbCells; j++ ) {
				$row.append('<td>');
			}
			$tbody.append($row);
		}
		$table.append( $tbody );
		
		this.$el.find('.gantt-data-panel')
			.append( $table );
	},

	/**
	 * Render the table
	 */
	render : function() {
	
		this.$el.addClass('gantt-view');
		//this.$el.append('<div class="gantt-left-panel">');
		this.$el.append('<div class="gantt-data-panel">');
		
		this.buildTable( new Date(2005,03,1,12,52,12), new Date(2005,05,1,12,52,12), 20 );					
		
	}
	
});

return GanttView;

});