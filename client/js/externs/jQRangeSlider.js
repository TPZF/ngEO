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
 
/** jQRangeSlider changed to a jquery mobile widget.
 * The widget handles JQM mouse "equivalent" events to cope with mouse and touch events.
 * Changed to not depend on jquery UI and implements it own drag events.
 * 
 * However it is tightly related to ngeo since it depends on the DatasetSearch and SearchResults
 * in order to be able to submit a search.
 */
define( [ "jquery", "jquery.mobile" ], 

// The function to define the rangeslider module
function($) {

	
	 $.widget("ngeo.rangeSlider",  $.mobile.widget,{
		
		options: {
			bounds: {min:0, max:100},
			scaleBounds: {min:0, max:1000},
			scaleRatio:1,
			defaultValues: {min:10, max:50},
			wheelMode: null,
			wheelSpeed: 4,
			arrows: true,
			valueLabels: "show",
			formatter: null,
			durationIn: 0,
			durationOut: 400,
			delayOut: 200
		},
		
		_values: null,
		_scaleValues: null,
		
		// Created elements
		bar: null,
		leftHandle: null,
		rightHandle: null,
		innerBar: null,
		scaleBar:null, //oli
		container: null,
		arrows: null,
		labels: null,
		changing: {min:false, max:false},
		changed: {min:false, max:false},
		
		// Scroll management
		lastWheel : 0,
		lastMouseX : 0, //oli
		moveScale : true, //oli
		lastScroll: 0,
		scrollCount: 0,
		
		//oli
		lastScaleScroll: 0,
		scalePosition:0,
		scaleRatio:0,
		boundsOffset:0,
		valueOffset:0,
		scrollScaleCount: 0,
		speed: 0,
		toc: true,

		_create: function(){
		
			this._values = this.options.defaultValues;
			this._scaleValues = this.options.scaleBounds;  //oli
			this.labels = {left: null, right:null, leftDisplayed:true, rightDisplayed:true};
			this.arrows = {left:null, right:null};
			this.changing = {min:false, max:false};
			this.changed = {min:false, max:false};
			
			var self = this;
			
			this.leftHandle = $("<div class='ui-rangeSlider-handle  ui-rangeSlider-leftHandle' />")
				.css("position", "absolute")
				.addClass("ui-draggable");
			
			this.leftHandle.bind({
				// add focus to the rightHandle
				vmousedown: function(event) {
					
					$( this ).focus();
					//$(this).addClass(".ui-draggable-dragging");
					console.log("startMovingLeftHandle...." + event);
					
					var posX = event.clientX;
				 	var leftHandle = $(this).offset().left;
		            var diffX = posX - leftHandle;
		            /** the jquery handle object and the start offest are passed into the handler through event.data*/
		            /** event.target does not always return the correct handle object*/
		            $(self.element).bind("vmousemove", {handle : $(this), diffX: diffX}, $.proxy(self.handleDragged, self));
				},
				
				focus: function() {
					$( this ).addClass( $.mobile.focusClass );
				}
			});
			
			this.rightHandle = $("<div class='ui-rangeSlider-handle ui-rangeSlider-rightHandle' />")
				.css("position", "absolute")
				.addClass("ui-draggable");
			
			this.rightHandle.bind({
				// add focus to the rightHandle
				vmousedown: function(event) {
					
					$( this ).focus();
					//$(this).addClass(".ui-draggable-dragging");
					console.log("startMovingRightHandle...." + event);
					var posX = event.clientX;
				 	var barRight = $(this).offset().left;
		            var diffX = posX - barRight;
		            /** the jquery handle object and the start offest are passed into the handler through event.data*/
		            /** event.target does not always return the correct handle object*/
		            $(self.element).bind("vmousemove",  {handle : $(this), diffX: diffX}, $.proxy(self.handleDragged, self));
				},
				
				focus: function() {
					$( this ).addClass( $.mobile.focusClass );
				}
			});
			      
			this.innerBar = $("<div class='ui-rangeSlider-innerBar' />")
				.css("position", "absolute")
				.css("overflow","hidden")
				.css("top", 0)
				.css("left", 0);

			//oli
			this.scaleBar = $("<div class='ui-rangeSlider-scaleBar' />")
				.css("position", "absolute")
				.css("top", 10)
				.css("left", 0);
		
			this.container = $("<div class='ui-rangeSlider-container' />")
				.css("position", "absolute")
				//prevent default behaviour of click and start drag on the container
				.bind("vmousedown", function(event){event.preventDefault()});
			
			this.bar = $("<div class='ui-rangeSlider-bar' />")
				.css("position", "absolute")
				.addClass("ui-draggable");
			
			this.bar.bind({
				
				// add focus to the bar
				vmousedown: function(event) {
					$( this ).focus();
					
					$(this).addClass(".ui-draggable-dragging");
					
					console.log("startMovingBar...." + event);
		        	var posX = event.clientX; 
		      		var barLeft = self.bar.offset().left;
		        	var diffX = posX - barLeft;
		        	
		            $(self.element).bind("vmousemove", {diffX: diffX}, $.proxy(self.barDragged, self));
				},
			
				focus : function() {
					$( this ).addClass( $.mobile.focusClass );
				},

				vmouseout : function() {
					$( this ).removeClass( $.mobile.focusClass );
				}			
			});
			
			this.arrows.left = $("<div class='ui-rangeSlider-arrow ui-rangeSlider-leftArrow' />")
				.css("position", "absolute")
				.css("left", 0)
				.css("top", 10)
				.bind("vmousedown", $.proxy(this._startScrollLeft, this));
			
			this.arrows.right = $("<div class='ui-rangeSlider-arrow ui-rangeSlider-rightArrow' />")
				.css("position", "absolute")
				.css("right", 0)
				.css("top", 10)
				.bind("vmousedown", $.proxy(this._startScrollRight, this));
			
			 $(self.element).bind("vmouseup", $.proxy(this.mouseUpHandler, this));

 			//oli
 			this.innerBar.append(this.scaleBar);
			
			this.container
				.append(this.leftHandle)
				.append(this.rightHandle)
				.append(this.innerBar)
				.append(this.bar);
			
			this.element
				.append(this.container)
				.append(this.arrows.left)
				.append(this.arrows.right)
				.addClass("ui-rangeSlider");
			
			if (this.element.css("position") != "absolute"){
				this.element.css("position", "relative");
			}
			
			if (!this.options.arrows){
				this.arrows.left.css("display", "none");
				this.arrows.right.css("display", "none");
				this.element.addClass("ui-rangeSlider-noArrow");
			}else{
				this.element.addClass("ui-rangeSlider-withArrows");
			}
			
			if (this.options.valueLabels != "hide"){
				this._createLabels();
			}else{
				this._destroyLabels();
			}
			
			$(window).resize($.proxy(this._resize, this));
			
			this.option(this.options);
						
			// Seems that when all the elements are not ready, outerWidth does not return the good value
			setTimeout($.proxy(this._initWidth, this), 1);
			
			//this._initWidth();
			setTimeout($.proxy(this._initValues, this), 1);
			//this._createScale();
		},
		
		/**  Callback method when the mouse is up after a mouse up event (after a mouse move) */
		mouseUpHandler  : function(event) {

			this._barStop(); 
			this._stopScroll(); 
			$(this.element).unbind("vmousemove");

		},
		
		/**
		 * Callback method when the right or left handlers are dragged
		 * the event.data contains the jquery handler object and the diffX
		 * when the drag starts. 
		 */
		handleDragged : function(event){
        	
            var posX = event.clientX;
            var left = posX - event.data.diffX;
            
        	var min = this._values.min;
			var max = this._values.max;

			// oli 
			this.moveScale=false;
			
			console.log("posX == " + posX);
			 var handle = event.data.handle;

			if (handle.hasClass('ui-rangeSlider-leftHandle')){
				min = this._getValue(left);				
			}else if (handle.hasClass('ui-rangeSlider-rightHandle')){
				max = this._getValue(left);
			}else {
				return;
			}

			if (min > max){
				this._switchHandles();
				var temp = min;
				min = max;
				max = temp;
			}
				
			this._privateValues(min, max);
			//self._position();
			console.log("min: "+min+" max: "+max);
			this._startScaleScroll();		// oli	
		},
		
		/** Callback method when the bar is dragged
		 *  the event.data contains the diffX when the drag starts. 
		 */
		barDragged : function(event){
        
            var posX = event.clientX;
            var left = posX - event.data.diffX;
			var right = left + this.bar.outerWidth(true) - 1;
			this._startScaleScroll();	// oli	

			this._setValues(this._getValue(left), this._getValue(right));
			this._positionHandles();
        },
	
//		_handleStop: function(){
//			this._position();
//			this._prepareFiringChanged();
//			// oli 
//			this.moveScale=true;
//		},
//	
		
		_barStop: function(){
			this._position();
			console.log("Bar stopped");
			this.bar.addClass( $.mobile.focusClass );
			this.bar.removeClass(".ui-draggable-dragging");
			this._prepareFiringChanged();
		},

		_initWidth: function(){
			this.container.css("width", this.element.width() - this.container.outerWidth(true) + this.container.width());
			this.innerBar.css("width", this.container.width() - this.innerBar.outerWidth(true) + this.innerBar.width());
			//oli
			this._createScale();
		},
		
		_initValues: function(){
			this.values(this.options.defaultValues.min, this.options.defaultValues.max);
		},
		
		_setOption: function(key, value) {
			if (key == "defaultValues")
			{
				if ((typeof value.min != "undefined") 
					&& (typeof value.max != "undefined") 
					&& parseFloat(value.min) === value.min 
					&& parseFloat(value.max) === value.max)
				{
					this.options.defaultValues = value;
				}
			}else if (key == "wheelMode" && (value == "zoom" || value == "scroll" || value===null)){
				this.options.wheelMode = value;
			}else if (key == "wheelSpeed" && parseFloat(value) !== NaN && Math.abs(parseFloat(value)) <= 100){
				this.options.wheelSpeed = parseFloat(value);
			}else if (key == "arrows" && (value === true || value === false) && value != this.options.arrows){
				if (value){
					this.element
						.removeClass("ui-rangeSlider-noArrow")
						.addClass("ui-rangeSlider-withArrows");
					this.arrows.left.css("display", "block");
					this.arrows.right.css("display", "block");
				}else{
					this.element
						.addClass("ui-rangeSlider-noArrow")
						.removeClass("ui-rangeSlider-withArrows");
					this.arrows.left.css("display", "none");
					this.arrows.right.css("display", "none");
				}
				
				this.options.arrows = value;
				this._initWidth();
				this._position();
			}else if (key == "valueLabels" && (value == "hide" || value == "show" || value == "change")){
				this.options.valueLabels = value;
				
				if (value != "hide"){
					this._createLabels();
				}else{
					this._destroyLabels();
				}
			}else if (key == "formatter" && value != null && typeof value == "function"){
				this.options.formatter = value;
				this._position();
			}else if (key == "bounds" && (typeof value.min != "undefined") 
					&& (typeof value.max != "undefined") 
					&& parseFloat(value.min) === value.min 
					&& parseFloat(value.max) === value.max
					&& value.min < value.max) {
						this.options.bounds = value;
						this.values(this._values.min, this._values.max);
			}else if (key == "scaleBounds" && (typeof value.min != "undefined") 
					&& (typeof value.max != "undefined") 
					&& parseFloat(value.min) === value.min 
					&& parseFloat(value.max) === value.max
					&& value.min < value.max) {
						this.options.scaleBounds = value;
			}else if (key == "scaleRatio" && (value != null)){
				this.options.scaleRatio = value;
			}
		},
		
		_getPosition: function(value){
			return (value - this.options.bounds.min) * (this.container.innerWidth() - 1) / (this.options.bounds.max - this.options.bounds.min);
		},
		
		_getValue: function(position){
			return position * (this.options.bounds.max - this.options.bounds.min) / (this.container.innerWidth() - 1) + this.options.bounds.min;
		},

		_getScaleValue: function(position){
			//return position * (this.options.bounds.max - this.options.bounds.min) / (this.container.innerWidth() - 1) + this.options.bounds.min;
			return position * (this.options.scaleBounds.max - this.options.scaleBounds.min) / (this.scaleBar.innerWidth() - 1) + this.options.scaleBounds.min;
		},

		_getScalePosition: function(value){
			return (value - this.options.scaleBounds.min) * (this.scaleBar.innerWidth() - 1) / (this.options.scaleBounds.max - this.options.scaleBounds.min);
		},
		
		_privateValues: function(min, max){
			this._setValues(min, max);
			this._position();
			
			return this._values;
		},
		
		_trigger: function(eventName){
			this.element.trigger(eventName, {
			  	label: this.element,
			  	values: this.values()
			  });
		},
		
		//oli
		/*
		_createScale: function(){
			var tick = 0;
			var tickNb = 0;
			var tickWidth = 100;
			var tickPos=0;
			var scaleUnit;
			
			// clear old scale
			this.scaleBar.empty();
			this.boundsOffset=0;
			this.valueOffset=0;

			console.log("Creating scale..."+this._format(this.options.scaleBounds.min)+" to "+this._format(this.options.scaleBounds.max));			
			scaleRatio = (this.options.scaleBounds.max-this.options.scaleBounds.min)/(this.options.bounds.max-this.options.bounds.min);
			//this.options.bounds.max = this.options.scaleBounds.max;
			//this.options.bounds.min = this.options.bounds.max - (this.options.scaleBounds.max-this.options.scaleBounds.min)*this.scaleRatio;
			console.log("Inner bar width :"+this.innerBar.width());
			console.log("Inner bar width 2:"+((this.options.scaleBounds.max-this.options.scaleBounds.min)/864501929));
			console.log("Scale unit size :"+(this.innerBar.width()/(this.options.bounds.max - this.options.bounds.min)));			
			//console.log("Scale ratio :"+scaleRatio);			
			console.log("Scale bar width :"+(this.innerBar.width()*scaleRatio));	
			this.scaleBar
				.css("width", this.innerBar.width()*scaleRatio);
				
			var cursor = 0;
			var lastCursor = 100;
			var dateArray;
			var label;
			while (cursor <= this.innerBar.width()*scaleRatio) {
				dateArray=this._format(this._getScaleValue(cursor)).split("-");
				if(dateArray[0]==1 && (cursor-1) != lastCursor) {
					lastCursor=cursor;
					if(dateArray[1]=="Jan") { //label=dateArray[2]; else label=dateArray[1];
						scaleUnit = $("<span class='ui-rangeSlider-bigScaleUnit'>"+dateArray[2]+"</span>")
							.css("position", "absolute")
							.css("top", -7)
							.css("left", cursor);
						this.scaleBar
							.append(scaleUnit);
						} 
					if(dateArray[1]!="Jan" && dateArray[1]!="Feb") { 
						scaleUnit = $("<span class='ui-rangeSlider-scaleUnit'>"+dateArray[1]+"</span>")
//						scaleUnit = $("<span class='ui-rangeSlider-scaleUnit'>"+"."+"</span>")
							.css("position", "absolute")
							.css("top",-1)
							.css("left", cursor);
						this.scaleBar
							.append(scaleUnit);
					}
				}
				cursor+=1;
			}

			
			this.scalePosition=0-this._getScalePosition(this.options.bounds.min);
			this.scaleBar
				.css("left",this.scalePosition);
				//.css("left",tickWidth*tickNb*-1+tickWidth*tickNb);
	
		},
		*/
		_createScale: function(){
			var tick = 0;
			var tickNb = 0;
			var tickWidth = 100;
			var tickPos=0;
			var scaleUnit;
			//var tune=86450192;
			var tune=86450192*1;
			
			// clear old scale
			this.scaleBar.empty();
			this.boundsOffset=0;
			this.valueOffset=0;

			console.log("Creating scale..."+this._format(this.options.scaleBounds.min)+" to "+this._format(this.options.scaleBounds.max));			
			scaleRatio = (this.options.scaleBounds.max-this.options.scaleBounds.min)/(this.options.bounds.max-this.options.bounds.min);
			//console.log("Scale ratio :"+scaleRatio);			
			//console.log("Scale bar width :"+(this.innerBar.width()*scaleRatio));	
			var scaleWidth = Math.floor((this.options.scaleBounds.max-this.options.scaleBounds.min)/tune*this.options.scaleRatio);
			var scaleWidthRatio = scaleWidth/this.innerBar.width();


			this.options.bounds.max = this.options.scaleBounds.max;
			this.options.bounds.min = this.options.bounds.max - (this.options.scaleBounds.max-this.options.scaleBounds.min)/scaleWidthRatio;

			console.log("Inner bar width :"+this.innerBar.width());
			console.log("bounds visible: "+this._format(this.options.bounds.min)+" to "+this._format(this.options.bounds.max));			
			console.log("scaleWidth: "+scaleWidth);
			console.log("scaleWidthRatio: "+scaleWidthRatio);

			this.scaleBar
				.css("width", scaleWidth);
				
			var cursor = 0;
			var lastCursor = 100;
			var dateArray;
			var label;
			while (cursor <= scaleWidth) {
				dateArray=this._format(this._getScaleValue(cursor)).split("-");
				if(dateArray[0]==1 && (cursor-1) != lastCursor) {
					lastCursor=cursor;
					if(dateArray[1]=="Jan") { 
						scaleUnit = $("<span class='ui-rangeSlider-bigScaleUnit'>"+dateArray[2]+"</span>")
							.css("position", "absolute")
							.css("top", -7)
							.css("left", cursor);
						this.scaleBar
							.append(scaleUnit);
						} 
					if(dateArray[1]!="Jan" && dateArray[1]!="Feb") { 
						scaleUnit = $("<span class='ui-rangeSlider-scaleUnit'>"+dateArray[1]+"</span>")
//						scaleUnit = $("<span class='ui-rangeSlider-scaleUnit'>"+"."+"</span>")
							.css("position", "absolute")
							.css("top",-1)
							.css("left", cursor);
						this.scaleBar
							.append(scaleUnit);
					}
				}
				cursor+=1;
			}

			
			this.scalePosition=0-this._getScalePosition(this.options.bounds.min);
			this.scaleBar
				.css("left",this.scalePosition);
				//.css("left",tickWidth*tickNb*-1+tickWidth*tickNb);
	
		},
		
		//oli
		_positionScaleRight: function(quantity){
			var lastPos=this.scalePosition;
			this.scalePosition += quantity;
			if(this.scalePosition <= (this.scaleBar.width()*-1)+this.innerBar.width()) {
				this.scalePosition = (this.scaleBar.width()*-1)+this.innerBar.width();
			}
			if(this.scalePosition >= 0 ) {
				this.scalePosition = 0;
			}
			this.boundsOffset+=lastPos-this.scalePosition;
			this.scaleBar
				.css("left", this.scalePosition);
			this._positionLabels();
		},


		_position: function(){
			var leftPosition = this._getPosition(this._values.min);
			var rightPosition = this._getPosition(this._values.max);
			
			this._positionHandles();
			this.bar
				.css("left", leftPosition)
				.css("width", rightPosition- leftPosition + this.bar.width() - this.bar.outerWidth(true) + 1);
		},
		
		_positionHandles: function(){
			var left = this._getPosition(this._values.min);
			var right = this._getPosition(this._values.max) - this.rightHandle.outerWidth(true);
			this.leftHandle.css("left", left);
			this.rightHandle.css("left", right);
			
			this._positionLabels();
		},
		

		_switchHandles: function(){
				var temp = this.leftHandle;
				this.leftHandle = this.rightHandle;
				this.rightHandle = temp;
				
				this.leftHandle
					.removeClass("ui-rangeSlider-rightHandle")
					.addClass("ui-rangeSlider-leftHandle");
				this.rightHandle
					.addClass("ui-rangeSlider-rightHandle")
					.removeClass("ui-rangeSlider-leftHandle");
		},
		
		_changing: function(min, max){
			this._trigger("valuesChanging");
			
			var show = false;
			if (min && !this.changing.min){
				this._trigger("minValueChanging");
				this.changing.min = true;
				show = true;
			}
			
			if (max && !this.changing.max){
				this._trigger("maxValueChanging");
				this.changing.max = true;
				show = true;
			}
			
			if (show){
				this._showLabels();
			}
		},
		
		_prepareFiringChanged: function(){
			this.lastWheel = Math.random();
			var last = this.lastWheel;
			setTimeout($.proxy(function(){this._fireChanged(last);}, this), 1000);
		},
		

		_fireChanged: function(last){
			if (this.lastWheel == last && !this.bar.hasClass("ui-draggable-dragging") && !this.leftHandle.hasClass("ui-draggable-dragging") && !this.rightHandle.hasClass("ui-draggable-dragging")){
				var changed = false;
				this._hideLabels();
				if (this.changing.min){
					this.changing.min = false;
					this._trigger("minValueChanged");
					changed = true;
				}
				
				if (this.changing.max){
					this.changing.max = false;
					this._trigger("maxValueChanged");
					changed = true;
				}
				
				if (changed){
					this._trigger("valuesChanged");
				}
				
			}
		},
		
		_setValuesHandles: function(min, max){	
			this._setValues(min, max);
			this._positionHandles();
		},
	
		_setValues: function(min, max){
			var oldValues = this._values;
			var difference = Math.abs(max-min);
			
			if (difference >= this.options.bounds.max - this.options.bounds.min){
				this._values.min = this.options.bounds.min;
				this._values.max = this.options.bounds.max;
			}else{
				values = {min: Math.min(max, min), max:Math.max(min, max)};
				
				if (values.min < this.options.bounds.min){
					values.min = this.options.bounds.min;
					values.max = values.min + difference;
				}else if (values.max > this.options.bounds.max){
					values.max = this.options.bounds.max;
					values.min = values.max - difference;
				}
				
				this._values = values;

			}

			// oli
			//this._startScaleScroll();			
			
			this._changing(oldValues.min != this._values.min, oldValues.max != this._values.max);
			this._prepareFiringChanged();
		},
		
		_resize: function(){
			//oli commented to get faster window resize since slider width is fixed.
			this._initWidth();
			this._position();
		},
		
		
		// oli
		_startScaleScroll: function(){
			this.lastScaleScroll = Math.random();
			this.scrollScaleCount = 0;	//oli	
			this.bounceScaleCount = 0;	//oli			
			//console.log("toc:"+this.toc+(this._values.min == this.options.bounds.min));
			if(this._values.min == this.options.bounds.min) {
				if(this.toc) {
					this.speed=0;
					console.log("TOC");
					this.toc=false;
					}
				this._continueScaleScrolling(10,this.lastScaleScroll);
			} 
			if(this._values.max == this.options.bounds.max) {
				if(this.toc) {
					this.speed=0;
					console.log("TOC");
					this.toc=false;
					}
				this._continueScaleScrolling(-10,this.lastScaleScroll);
			} 
			
		},

		_continueScaleScrolling: function(quantity, lastScale){
			if (lastScale == this.lastScaleScroll){
				//var factor = Math.min(Math.floor(this.scrollScaleCount / 5) + 1, 100) / 4;
				var factor = this.scrollScaleCount * quantity

				this._positionScaleRight(quantity + factor);
				//this._positionScaleRight(quantity + (Math.abs(this.speed)+1));
				this.scrollScaleCount++;
				setTimeout($.proxy(function(){this._continueScaleScrolling(quantity, lastScale);}, this), 50);
			}
			
		},

		_scaleBounce: function(direction,quantity){
			if (quantity != 0) {
				console.log("Bounce:");
				// var factor = Math.min(Math.floor(this.bounceScaleCount / 5) + 1, 100) / 4;
				this._positionScaleRight(quantity);
				quantity = quantity+(1*direction);
				setTimeout($.proxy(function(){this._continueScaleScrolling(-1, quantity);}, this), 50);
			}
			
		},

		/*
		 * Scrolling
		 */
		
		_startScrollLeft: function(event){
			this.lastScroll = Math.random();
			this.scrollCount = 0;
			this._continueScrollingRight(-10, this.lastScroll);
		},
		
		_startScrollRight: function(event){
			this.lastScroll = Math.random();
			this.scrollCount = 0;
			this._continueScrollingRight(10, this.lastScroll);
		},
		
		_continueScrollingRight: function(quantity, last){
			if (last == this.lastScroll){
				var factor = Math.min(Math.floor(this.scrollCount / 5) + 1, 100) / 4;
				
				this.scrollRight(quantity * factor);
				this.scrollCount++;
				setTimeout($.proxy(function(){this._continueScrollingRight(quantity, last);}, this), 50);
			}
		},
		
		_stopScroll: function(){
			this.lastScroll = Math.random();
			//this.toc = true;
			this.lastScaleScroll = Math.random();
		},
		
		/*
		 * Mouse wheel
		 */
		
//		_wheelOnBar: function(event, delta, deltaX, deltaY){
//			if (this.options.wheelMode == "zoom"){
//				this.zoomIn(-deltaY);
//				return false;
//			}
//		},
// mouse wheel is not used
//		_wheelOnContainer: function(event, delta, deltaX, deltaY){
//			if (this.options.wheelMode == "scroll"){
//				//this.speed+=Math.abs(deltaY);
//				this.scrollRight(-deltaY);
//				
//				return false;
//			}
//		},
		
		/*
		 * Value labels
		 */
		_createLabel: function(label, classes){
			if (label == null){
				label = $("<div class='ui-rangeSlider-label'/>")
					.addClass(classes)
					.css("position", "absolute");
				this.element.append(label);
				
				this._positionLabels();
			}
			
			return label;
		},
		
		_destroyLabel: function(label){
			if (label != null){
				label.remove();
				label = null;
			}
			
			return label;
		},
		
		_createLabels: function(){
			this.labels.left = this._createLabel(this.labels.left, "ui-rangeSlider-leftLabel");
			this.labels.right = this._createLabel(this.labels.right, "ui-rangeSlider-rightLabel");
			
			if (this.options.valueLabels == "change"){
				this.labels.left.css("display", "none");
				this.labels.right.css("display", "none");
				this.labels.leftDisplayed = false;
				this.labels.rightDisplayed = false;
			}else{
				this.labels.leftDisplayed = true;
				this.labels.rightDisplayed = true;
				this.labels.left.css("display", "block");
				this.labels.right.css("display", "block");
				
				this._position();
			}
		},
		
		_destroyLabels: function(){
			this.labels.left = this._destroyLabel(this.labels.left);
			this.labels.right = this._destroyLabel(this.labels.right);
		},
		
		_positionLabel: function(label, position){
			var topPos = this.leftHandle.offset().top - label.outerHeight(true);
			var parent = label.offsetParent();
			
			var leftPos = position - parent.offset().left;
			var topPos = topPos - parent.offset().top;
			
			label
				.css("left", leftPos)
				.css("top", topPos);
		},
		
		_positionLabels: function(){
			if (this.labels.left != null && this.labels.right != null){
				this.valueOffset=this._getValue(this.boundsOffset)-this.options.bounds.min;
				this.labels.left.text(this._format(this._values.min+this.valueOffset)); 
				this.labels.right.text(this._format(this._values.max+this.valueOffset));
				
				var minSize = this.labels.leftDisplayed ? this.labels.left.outerWidth(true) : 0;
				var maxSize = this.labels.rightDisplayed ? this.labels.right.outerWidth(true) : 0;
				var leftBound = 0;
				var rightBound = $(window).width() - maxSize;
				var minLeft = Math.max(leftBound, this.leftHandle.offset().left + this.leftHandle.outerWidth(true) / 2 - minSize / 2); 
				var maxLeft = Math.min(rightBound, this.rightHandle.offset().left + this.rightHandle.outerWidth(true) / 2 - maxSize / 2);
				
				// Need to find a better position
				if (minLeft + minSize >= maxLeft){
					var diff =  minLeft + minSize - maxLeft;
					minLeft = Math.max(leftBound, minLeft - diff / 2);
					maxLeft = Math.min(rightBound, minLeft + minSize);
					minLeft = Math.max(leftBound, maxLeft - minSize);
				}
				
				if (this.labels.leftDisplayed) this._positionLabel(this.labels.left, minLeft);
				if (this.labels.rightDisplayed) this._positionLabel(this.labels.right, maxLeft);
			}
		},
		
		_format: function(value){
			if (typeof this.options.formatter != "undefined" && this.options.formatter != null){
				return this.options.formatter(value);
			}else{
				return this._defaultFormat(value);
			}
		},
		
		_defaultFormat: function(value){
			return Math.round(value);
		},
/*		
		_showLabels: function(){
			if (this.options.valueLabels == "change" && !this.privateChange){
				if (this.changing.min && !this.labels.leftDisplayed){
					this.labels.left.stop(true, true).fadeIn(this.options.durationIn);
					this.labels.leftDisplayed = true;
				}
				
				if (this.changing.max && !this.labels.rightDisplayed){
					this.labels.rightDisplayed = true;
					this.labels.right.stop(true, true).fadeIn(this.options.durationIn);
				}
			}
		},
*/		
		_showLabels: function(){
			if (this.options.valueLabels == "change" && !this.privateChange){
				if ((this.changing.min && !this.labels.leftDisplayed)||(this.changing.max && !this.labels.rightDisplayed)){
					this.labels.rightDisplayed = true;
					this.labels.leftDisplayed = true;
					this.labels.right.stop(true, true).fadeIn(this.options.durationIn);
					this.labels.left.stop(true, true).fadeIn(this.options.durationIn);
				}
			}
		},

		_hideLabels: function(){
			if (this.options.valueLabels == "change" && this.labels.left != null && this.labels.right != null){
				this.labels.leftDisplayed = false;
				this.labels.rightDisplayed = false;
				this.labels.left.stop(true, true).delay(this.options.delayOut).fadeOut(this.options.durationOut);
				this.labels.right.stop(true, true).delay(this.options.delayOut).fadeOut(this.options.durationOut);
			}
		},
		
		/*
		 * Public methods
		 */
		
		values: function(min, max){
			if (typeof min != "undefined" 
				&& typeof max != "undefined")
			{
				this.internalChange = false;
				this._privateValues(min,max);
				this.internalChange = true;
			}
			
			//return this._values; 
			return {min:this._values.min+this.valueOffset,max:this._values.max+this.valueOffset};
		},
		
		min: function(min){
			return this.values(min, this._values.max).min;
		},
		
		max: function(max){
			return this.values(this._values.min, max).max;
		},
		
		zoomIn: function(quantity){
			var diff = this._values.max - this._values.min;
					
			min = this._values.min + quantity * this.options.wheelSpeed * diff / 200;
			max = this._values.max - quantity * this.options.wheelSpeed * diff / 200;
			
			this._privateValues(min, max);
		},
		
		zoomOut: function(quantity){
			this.zoomIn(-quantity);
		},
		
		scrollLeft: function(quantity){
			if (typeof quantity == 'undefined')
				quantity = 10;
			this.scrollRight(-quantity);
		},
		
		scrollRight: function(quantity){
			if (typeof quantity == "undefined")
				quantity = 10;
			var diff = this._values.max - this._values.min;
			
			//var diff = this.options.bounds.max - this.options.bounds.min;
		
			min = this._values.min + quantity * this.options.wheelSpeed * diff / 100;
			max = this._values.max + quantity * this.options.wheelSpeed * diff / 100;
			
			this._startScaleScroll();			
			this._privateValues(min, max);
			
		},
		
		/**  detroy with calling remove rather than detach */
		destroy: function(){
			this.element.removeClass("ui-rangeSlider-withArrows")
			.removeClass("ui-rangeSlider-noArrow");
			this.container.remove();
			this.bar.remove();
			this.leftHandle.remove();
			this.rightHandle.remove();
			this.innerBar.remove();
			this.container.remove();
			this.scaleBar.remove();
			this.arrows.left.remove();
			this.arrows.right.remove();
			this.element.removeClass("ui-rangeSlider");
			this._destroyLabels();
			delete this.options;
			
			$.Widget.prototype.destroy.apply(this);
		}
	});
});