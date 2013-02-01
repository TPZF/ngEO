/* jQRangeSlider
 * A javascript slider selector that supports dates
 * 
 * Copyright (C) Guillaume Gautreau 2010, 2011
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


// The function to define the rangeslider module
define( [ "jquery", "search/model/datasetSearch", "searchResults/model/searchResults", "jquery.rangeSlider", "jquery.mobile" ], 

// The function to define the daterangeslider module
function($, DatasetSearch, SearchResults) {
	
	$.widget("ngeo.dateRangeSlider", $.ngeo.rangeSlider, {
		
		options: {
			bounds: {min: new Date(2010,0,1), max: new Date(2012,0,1)},
			scaleBounds: {min: new Date(2000,0,1), max: new Date(2012,0,1)},
			defaultValues: {min: new Date(2010,1,11), max: new Date(2011,1,11)}
		},
		
		//uncomment to synchronize the date and time slider widgets
//		_create: function(){
//			$.ngeo.rangeSlider.prototype._create.apply(this, arguments);
//			var self = this;
//			DatasetSearch.on("change:startdate", function(){ self._setValuesHandles(DatasetSearch.getStartDate(), self.max());
//															self._position();});
//			DatasetSearch.on("change:stopdate", function(){ self._privateValues(self.min(), DatasetSearch.getStopDate());
//															self._position();});
//		},
	
		_setOption: function(key, value){
			if ((key == "defaultValues" || key== "bounds" || key== "scaleBounds"|| key== "scaleRatio") && typeof value != "undefined" && value != null && typeof value.min != "undefined" && typeof value.max != "undefined" && value.min instanceof Date && value.max instanceof Date){
				$.ngeo.rangeSlider.prototype._setOption.apply(this, [key, {min:value.min.valueOf(), max:value.max.valueOf()}]);
			}else{
				$.ngeo.rangeSlider.prototype._setOption.apply(this, arguments);
			}
		},
		
		option: function(key, value){
			if (key == "bounds" || key == "defaultValues"){
				var result = $.ui.rangeSlider.prototype.option.apply(this, arguments);
				
				return {min:new Date(result.min), max:new Date(result.max)};
			}
			
			return $.ngeo.rangeSlider.prototype.option.apply(this, arguments);
		},
		
		_defaultFormat: function(value){
			var month = value.getMonth() + 1;
			var monthArray=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
			var day = value.getDate();
			//return "" + value.getFullYear() + "-" + (month < 10 ? "0" + month : month) 
			//	+ "-" + (day < 10 ? "0" + day : day);
			return "" +(day < 10 ? "0" + day : day) + "-" + monthArray[month-1] + "-" + value.getFullYear() ;
		},
		
		_format: function(value){
			return $.ngeo.rangeSlider.prototype._format.apply(this, [new Date(value)]);
		},
		
		values: function(min, max){
			if (typeof min != "undefined" && typeof max != "undefined" && min instanceof Date && max instanceof Date)
			{
				values = $.ngeo.rangeSlider.prototype.values.apply(this, [min.valueOf(), max.valueOf()]);
			}else{
				values = $.ngeo.rangeSlider.prototype.values.apply(this, arguments);
			}
			
			return {min: new Date(values.min), max: new Date(values.max)};
		},
		
		min: function(min){
			if (typeof min != "undefined" && min instanceof Date){
				return new Date($.ngeo.rangeSlider.prototype.min.apply(this, [min.valueOf()]));
			}
			
			return new Date($.ngeo.rangeSlider.prototype.min.apply(this));
		},
		
		max: function(max){
			if (typeof max != "undefined" && max instanceof Date){
				return new Date($.ui.rangeSlider.prototype.max.apply(this, [max.valueOf()]));
			}
			
			return new Date($.ngeo.rangeSlider.prototype.max.apply(this));
		}, 
		
		/**  Callback method when the mouse is up after a mouse mouve */
		mouseUpHandler  : function(event) {
			
			$.ngeo.rangeSlider.prototype.mouseUpHandler.apply(this, arguments);

			console.log("mouseUpHandler  ------ this.min" + this.min());
			//set the selected start and end dates in the search model
			DatasetSearch.setStartDate(this.min());
			DatasetSearch.setStopDate(this.max());
			
			//submit search after the selection has been set
			SearchResults.launch( DatasetSearch.getOpenSearchURL() );
			
		},
		
		destroy: function(){
			$.ngeo.rangeSlider.prototype.destroy.apply(this);
		}
	});
});