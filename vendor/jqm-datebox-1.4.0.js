(function ( root, doc, factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. 
		// REQUIRE BOTH jQuery AND jQueryMobile FIRST.
		// NO RETURN, as we are augmenting the jqm object.

		define( [ "jquery", "jquery.mobile" ], function ( $, Mobile ) {
			factory( $, root, doc );
		});
	} else {
		// Browser globals
		factory( root.jQuery, root, doc );
	}
}( this, document, function ( jQuery, window, document, undefined ) {
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
/* CORE Functions */

(function($) {
	$.widget( "mobile.datebox", $.mobile.widget, {
		options: {
			// All widget options, including some internal runtime details
			version: '2-1.4.2-2014072500', // jQMMajor.jQMMinor.DBoxMinor-YrMoDaySerial
			mobVer: parseInt($.mobile.version.replace(/\./g,'')),
			theme: false,
			themeDefault: 'a',
			themeHeader: 'a',
			mode: false,
			
			centerHoriz: false,
			centerVert: false,
			transition: 'pop',
			useAnimation: true,
			hideInput: false,
			hideFixedToolbars: false,
			
			lockInput: true,
			enhanceInput: true,
			
			zindex: '1100',
			clickEvent: 'vclick',
			clickEventAlt: 'click',
			resizeListener: true,
			
			defaultValue: false,
			showInitialValue: false,
			
			dialogEnable: false,
			dialogForce: false,
			enablePopup: false,
			
			popupPosition: false,
			popupForceX: false,
			popupForceY: false,
			
			useModal: false,
			useInline: false,
			useInlineBlind: false,
			useHeader: true,
			useImmediate: false,
			useNewStyle: false,
			useAltIcon: false,
			overrideStyleClass: false,
			
			useButton: true,
			useFocus: false,
			useClearButton: false,
			useCollapsedBut: false,
			usePlaceholder: false,
			
			openCallback: false,
			openCallbackArgs: [],
			closeCallback: false,
			closeCallbackArgs: [],
			
			startOffsetYears: false,
			startOffsetMonths: false,
			startOffsetDays: false,
			afterToday: false,
			beforeToday: false,
			notToday: false,
			maxDays: false,
			minDays: false,
			maxYear: false,
			minYear: false,
			blackDates: false,
			blackDatesRec: false,
			blackDays: false,
			minHour: false,
			maxHour: false,
			minuteStep: 1,
			minuteStepRound: 0,
			
			rolloverMode: { 'm': true, 'd': true, 'h': true, 'i': true, 's': true },
			
			useLang: 'default',
			lang: {
				'default' : {
					setDateButtonLabel: 'Set Date',
					setTimeButtonLabel: 'Set Time',
					setDurationButtonLabel: 'Set Duration',
					calTodayButtonLabel: 'Jump to Today',
					calTomorrowButtonLabel: 'Jump to Tomorrow',
					titleDateDialogLabel: 'Set Date',
					titleTimeDialogLabel: 'Set Time',
					daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
					daysOfWeekShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
					monthsOfYear: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
					monthsOfYearShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
					durationLabel: ['Days', 'Hours', 'Minutes', 'Seconds'],
					durationDays: ['Day', 'Days'],
					timeFormat: 24,
					headerFormat: '%A, %B %-d, %Y',
					tooltip: 'Open Date Picker',
					nextMonth: 'Next Month',
					prevMonth: 'Previous Month',
					dateFieldOrder: ['m', 'd', 'y'],
					timeFieldOrder: ['h', 'i', 'a'],
					slideFieldOrder: ['y', 'm', 'd'],
					dateFormat: '%Y-%m-%d',
					useArabicIndic: false,
					isRTL: false,
					calStartDay: 0,
					clearButton: 'Clear',
					durationOrder: ['d', 'h', 'i', 's'],
					meridiem: ['AM', 'PM'],
					timeOutput: '%k:%M', //{ '12': '%l:%M %p', '24': '%k:%M' },
					durationFormat: '%Dd %DA, %Dl:%DM:%DS',
					calDateListLabel: 'Other Dates',
					calHeaderFormat: '%B %Y'
				}
			}
		},
		_enhanceDate: function() {
			$.extend(this._date.prototype, {
				copy: function(adjust, override) {
					/* Get a modified copy of the date.
					 * First array - Offset the new date by #  (position determines date part)
					 * Second array - If non-zero, force the new date by # (position determines date part)
					 */
					if ( typeof adjust === 'undefined' ) { adjust = [0,0,0,0,0,0,0]; }
					if ( typeof override === 'undefined' ) { override = [0,0,0,0,0,0,0]; }
					while ( adjust.length < 7 ) { adjust.push(0); }
					while ( override.length < 7 ) { override.push(0); }
					return new Date(
						((override[0] > 0 ) ? override[0] : this.getFullYear() + adjust[0]),
						((override[1] > 0 ) ? override[1] : this.getMonth() + adjust[1]),
						((override[2] > 0 ) ? override[2] : this.getDate() + adjust[2]),
						((override[3] > 0 ) ? override[3] : this.getHours() + adjust[3]),
						((override[4] > 0 ) ? override[4] : this.getMinutes() + adjust[4]),
						((override[5] > 0 ) ? override[5] : this.getSeconds() + adjust[5]),
						((override[6] > 0 ) ? override[5] : this.getMilliseconds() + adjust[6]));
				},
				adj: function (type, amount) {
					/* Adjust the date.  Yes, this is chainable */
					if ( typeof amount !== 'number' ) {
						throw new Error("Adjustment value not specified");
					}
					if ( typeof type !== 'number' ) {
						throw new Error("Adjustment type not specified");
					}
					switch ( type ) {
						case 0: this.setFullYear(this.getFullYear() + amount); break;
						case 1: this.setMonth(this.getMonth() + amount); break;
						case 2: this.setDate(this.getDate() + amount); break;
						case 3: amount *= 60;
                        case 4: amount *= 60;
                        case 5: amount *= 1000;
                        case 6: this.setTime(this.getTime() + amount); break;
					}
					return this;
				},
				setD: function(type, amount) {
					/* A chainable version of setWhatever() */
					switch ( type ) {
						case 0: this.setFullYear(amount); break;
						case 1: this.setMonth(amount); break;
						case 2: this.setDate(amount); break;
						case 3: this.setHours(amount); break;
						case 4: this.setMinutes(amount); break;
						case 5: this.setSeconds(amount); break;
						case 6: this.setMilliseconds(amount); break;
					}
					return this;
				},
				get: function(type) {
					switch ( type ) {
						case 0: return this.getFullYear();
						case 1: return this.getMonth();
						case 2: return this.getDate();
						case 3: return this.getHours();
						case 4: return this.getMinutes();
						case 5: return this.getSeconds();
					}
					return false;
				},
				iso: function() {
					return String(this.getFullYear()) + '-' + (( this.getMonth() < 9 ) ? "0" : "") + String(this.getMonth()+1) + '-' + ((this.getDate() < 10 ) ? "0" : "") + String(this.getDate());
				},
				comp: function () { 
					return parseInt(this.iso().replace(/-/g,''),10); 
				},
				getEpoch: function() { 
					return (this.getTime() - this.getMilliseconds()) / 1000; 
				},
				getArray: function() {
					return [this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds()];
				},
				setFirstDay: function (day) {
					this.setD(2,1).adj(2, (day - this.getDay()));
					if ( this.get(2) > 10 ) { this.adj(2,7); }
					return this; 
				},
				setDWeek: function (type,num) {
					if ( type === 4 ) {
						return this.setD(1,0).setD(2,1).setFirstDay(4).adj(2,-3).adj(2,(num-1)*7);
					}
					return this.setD(1,0).setD(2,1).setFirstDay(type).adj(2,(num-1)*7);
				},
				getDWeek: function (type) {
					var t1, t2;
					
					switch ( type ) {
						case 0:
							t1 = this.copy([0,-1*this.getMonth()]).setFirstDay(0);
							return Math.floor((this.getTime() - ( t1.getTime() + (( this.getTimezoneOffset() - t1.getTimezoneOffset()) * 60000))) / 6048e5) + 1;
							//return Math.floor((this.getTime() - t1.getTime()) / 6048e5) + 1;
						case 1:
							t1 = this.copy([0,-1*this.getMonth()]).setFirstDay(1);
							return Math.floor((this.getTime() - ( t1.getTime() + (( this.getTimezoneOffset() - t1.getTimezoneOffset()) * 60000))) / 6048e5) + 1;
							//return Math.floor((this.getTime() - t1.getTime()) / 6048e5) + 1;
						case 4:
							// this line is some bullshit.  but it does work.
							// (trap for dec 29, 30, or 31st being in the new year's week - these are the
							//  only 3 that can possibly fall like this)
							if ( this.getMonth() === 11 && this.getDate() > 28 ) { return 1; } 
							
							t1 = this.copy([0,-1*this.getMonth()],true).setFirstDay(4).adj(2,-3);
							t2 = Math.floor((this.getTime() - ( t1.getTime() + (( this.getTimezoneOffset() - t1.getTimezoneOffset()) * 60000))) / 6048e5) + 1;
							
							if ( t2 < 1 ) {
								t1 = this.copy([-1,-1*this.getMonth()]).setFirstDay(4).adj(2,-3);
								return Math.floor((this.getTime() - t1.getTime()) / 6048e5) + 1;
							}
							return t2;
						default:
							return 0;
					}
				}
			});
		},
		_event: function(e, p) {
			var w = $(this).data(parseInt($.mobile.version.replace(/\./g,''),10) > 110 ? 'mobile-datebox' : 'datebox');
			if ( ! e.isPropagationStopped() ) {
				switch (p.method) {
					case 'close':
						w.close(); break;
					case 'open':
						w.open(); break;
					case 'set':
						$(this).val(p.value);
						$(this).trigger('change');
						break;
					case 'doset':
						if ( $.isFunction(w['_'+w.options.mode+'DoSet']) ) {
							w['_'+w.options.mode+'DoSet'].apply(w,[]);
						} else {
							$(this).trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(), w.theDate), 'date':w.theDate});
						}
						break;
					case 'dooffset':
						if (p.type) { w._offset(p.type, p.amount, true); } break; 
					case 'dorefresh':
						w.refresh(); break;
					case 'doreset':
						w.hardreset(); break;
					case 'doclear':
						$(this).val('').trigger('change'); break;
					case 'clear':
						$(this).trigger('change');
				}
			}
		},
		_hoover: function(item) {
			// Hover toggle class, for calendar
			$(item).toggleClass('ui-btn-up-'+$(item).jqmData('theme')+' ui-btn-down-'+$(item).jqmData('theme'));
		},
		_ord: {
			'default': function (num) {
				// Return an ordinal suffix (1st, 2nd, 3rd, etc)
				var ending = num % 10;
				if ( num > 9 && num < 21 ) { return 'th'; }
				if ( ending > 3 ) { return 'th'; }
				return ['th','st','nd','rd'][ending];
			}
		},
		__ : function(val) {
			var o = this.options,
				oride = 'override' + val.charAt(0).toUpperCase() + val.slice(1);
				
			if ( typeof o[oride] !== 'undefined' ) { return o[oride]; }
			if ( typeof o.lang[o.useLang][val] !== 'undefined' ) { return o.lang[o.useLang][val]; }
			if ( typeof o[o.mode+'lang'] !== 'undefined' && typeof o[o.mode+'lang'][val] !== 'undefined' ) { return o[o.mode+'lang'][val]; }
			return o.lang['default'][val];
		},
		__fmt: function() {
			var w = this,
				o = this.options;
			
			switch ( o.mode ) {
				case 'timebox':
				case 'timeflipbox':
					return w.__('timeOutput');
				case 'durationbox':
				case 'durationflipbox':
					return w.__('durationFormat');
				default:
					return w.__('dateFormat');
			}
		},
		_zPad: function(number) {
			return (( number < 10 ) ? '0' + String(number) : String(number));
		},
		_dRep: function(oper, direction) {
			var start = 48,
				end = 57,
				adder = 1584,
				i = null, 
				ch = null,
				newd = '';
				
			if ( direction === -1 ) {
				start += adder;
				end += adder;
				adder = -1584;
			}
			
			for ( i=0; i<oper.length; i++ ) {
				ch = oper.charCodeAt(i);
				if ( ch >= start && ch <= end ) {
					newd = newd + String.fromCharCode(ch+adder);
				} else {
					newd = newd + String.fromCharCode(ch);
				}
			}
			
			return newd;
		},
		_doIndic: function() {
			var w = this;
				
			w.d.intHTML.find('*').each(function() {
				if ( $(this).children().length < 1 ) {
					$(this).text(w._dRep($(this).text()));
				} else if ( $(this).hasClass('ui-datebox-slideday') ) {
					$(this).html(w._dRep($(this).html()));
				}
			});
			w.d.intHTML.find('input').each(function() {
				$(this).val(w._dRep($(this).val()));
			});
		},
		_parser: {
			'default': function (str) { return false; }
		},
		_n: function (val,def) {
			return ( val < 0 ) ? def : val;
		},
		_pa: function (arr,date) {
			if ( typeof date === 'boolean' ) { return new this._date(arr[0],arr[1],arr[2],0,0,0,0); }
			return new this._date(date.getFullYear(), date.getMonth(), date.getDate(), arr[0], arr[1], arr[2], 0);
		},
		_makeDate: function (str) {
			// Date Parser
			str = $.trim(((this.__('useArabicIndic') === true)?this._dRep(str, -1):str));
			var w = this,
				o = this.options,
				adv = w.__fmt(),
				exp_input = null,
				exp_names = [],
				exp_format = null,
				exp_temp = null,
				date = new w._date(),
				d = { year: -1, mont: -1, date: -1, hour: -1, mins: -1, secs: -1, week: false, wtyp: 4, wday: false, yday: false, meri: 0 },
				i;
			
			if ( typeof o.mode === 'undefined' ) { return date; }
			if ( typeof w._parser[o.mode] !== 'undefined' ) { return w._parser[o.mode].apply(w,[str]); }
			
			if ( o.mode === 'durationbox' || o.mode === 'durationflipbox' ) {
				adv = adv.replace(/%D([a-z])/gi, function(match, oper) {
					switch (oper) {
						case 'd':
						case 'l':
						case 'M':
						case 'S': return '(' + match + '|' +'[0-9]+' + ')';
						default: return '.+?';
					}
				});
				
				adv = new RegExp('^' + adv + '$');
				exp_input = adv.exec(str);
				exp_format = adv.exec(w.__fmt());
				
				if ( exp_input === null || exp_input.length !== exp_format.length ) {
					if ( typeof o.defaultValue === "number" && o.defaultValue > 0 ) {
						return new w._date((w.initDate.getEpoch() + parseInt(o.defaultValue,10))*1000);
					} 
					return new w._date(w.initDate.getTime());
				} 
				
				exp_temp = w.initDate.getEpoch();
				for ( i=1; i<exp_input.length; i++ ) { //0y 1m 2d 3h 4i 5s
					if ( exp_format[i].match(/^%Dd$/i) )   { exp_temp = exp_temp + (parseInt(exp_input[i],10)*60*60*24); }
					if ( exp_format[i].match(/^%Dl$/i) )   { exp_temp = exp_temp + (parseInt(exp_input[i],10)*60*60); }
					if ( exp_format[i].match(/^%DM$/i) )   { exp_temp = exp_temp + (parseInt(exp_input[i],10)*60); }
					if ( exp_format[i].match(/^%DS$/i) )   { exp_temp = exp_temp + (parseInt(exp_input[i],10)); }
				}
				return new w._date((exp_temp*1000));
			}
			
			adv = adv.replace(/%(0|-)*([a-z])/gi, function(match, pad, oper) {
				exp_names.push(oper);
				switch (oper) {
					case 'p':
					case 'P':
					case 'b':
					case 'B': return '(' + match + '|' +'.+?' + ')';
					case 'H':
					case 'k':
					case 'I':
					case 'l':
					case 'm':
					case 'M':
					case 'S':
					case 'V':
					case 'U':
					case 'u':
					case 'W':
					case 'd': return '(' + match + '|' + (( pad === '-' ) ? '[0-9]{1,2}' : '[0-9]{2}') + ')';
					case 'j': return '(' + match + '|' + '[0-9]{3}' + ')';
					case 's': return '(' + match + '|' + '[0-9]+' + ')';
					case 'g':
					case 'y': return '(' + match + '|' + '[0-9]{2}' + ')';
					case 'E':
					case 'G':
					case 'Y': return '(' + match + '|' + '[0-9]{1,4}' + ')';
					default: exp_names.pop(); return '.+?';	
				}
			});
			
			adv = new RegExp('^' + adv + '$');
			exp_input = adv.exec(str);
			exp_format = adv.exec(w.__fmt());
			
			if ( exp_input === null || exp_input.length !== exp_format.length ) {
				if ( o.defaultValue !== false ) {
					switch ( typeof o.defaultValue ) {
						case 'object':
							if ( o.defaultValue.length === 3 ) {
								date =  w._pa(o.defaultValue,((o.mode === 'timebox' || o.mode === 'timeflipbox') ? date : false));
							} break;
						case 'number':
							date =  new w._date(o.defaultValue * 1000); break;
						case 'string':
							if ( o.mode === 'timebox' || o.mode === 'timeflipbox' ) {
								exp_temp = o.defaultValue.split(':');
								if ( exp_temp.length === 3 ) { date = w._pa([exp_temp[0],exp_temp[1],exp_temp[2]], date); }
								else if ( exp_temp.length === 2 ) { date = w._pa([exp_temp[0],exp_temp[1],0], date); }
							} else {
								exp_temp = o.defaultValue.split('-');
								if ( exp_temp.length === 3 ) { date = w._pa([exp_temp[0],exp_temp[1]-1,exp_temp[2]], false); }
							} break;
					}
				}
				if ( isNaN(date.getDate()) ) { date = new w._date(); }
			} else {
				for ( i=1; i<exp_input.length; i++ ) {
					switch ( exp_names[i-1] ) {
						case 's': return new w._date(parseInt(exp_input[i],10) * 1000);
						case 'Y':
						case 'G': d.year = parseInt(exp_input[i],10); break;
						case 'E': d.year = parseInt(exp_input[i],10) - 543; break;
						case 'y':
						case 'g':
							if ( o.afterToday === true || parseInt(exp_input[i],10) < 38 ) {
								d.year = parseInt('20' + exp_input[i],10);
							} else {
								d.year = parseInt('19' + exp_input[i],10);
							} break;
						case 'm': d.mont = parseInt(exp_input[i],10)-1; break;
						case 'd': d.date = parseInt(exp_input[i],10); break;
						case 'H':
						case 'k':
						case 'I':
						case 'l': d.hour = parseInt(exp_input[i],10); break;
						case 'M': d.mins = parseInt(exp_input[i],10); break;
						case 'S': d.secs = parseInt(exp_input[i],10); break;
						case 'u': d.wday = parseInt(exp_input[i],10)-1; break;
						case 'w': d.wday = parseInt(exp_input[i],10); break;
						case 'j': d.yday = parseInt(exp_input[i],10); break;
						case 'V': d.week = parseInt(exp_input[i],10); d.wtyp = 4; break;
						case 'U': d.week = parseInt(exp_input[i],10); d.wtyp = 0; break;
						case 'W': d.week = parseInt(exp_input[i],10); d.wtyp = 1; break;
						case 'p':
						case 'P': d.meri = (( exp_input[i].toLowerCase() === w.__('meridiem')[0].toLowerCase() )? -1:1); break;
						case 'b':
							exp_temp = $.inArray(exp_input[i], w.__('monthsOfYearShort'));
							if ( exp_temp > -1 ) { d.mont = exp_temp; }
							break;
						case 'B':
							exp_temp = $.inArray(exp_input[i], w.__('monthsOfYear'));
							if ( exp_temp > -1 ) { d.mont = exp_temp; }
							break;
					}
				}
				if ( d.meri !== 0 ) {
					if ( d.meri === -1 && d.hour === 12 ) { d.hour = 0; }
					if ( d.meri === 1 && d.hour !== 12 ) { d.hour = d.hour + 12; }
				}
				
				date = new w._date(w._n(d.year,0),w._n(d.mont,0),w._n(d.date,1),w._n(d.hour,0),w._n(d.mins,0),w._n(d.secs,0),0);
				
				if ( d.year < 100 && d.year !== -1 ) { date.setFullYear(d.year); }
				
				if ( ( d.mont > -1 && d.date > -1 ) || ( d.hour > -1 && d.mins > -1 && d.secs > -1 ) ) { return date; }
				
				if ( d.week !== false ) {
					date.setDWeek(d.wtyp, d.week);
					if ( d.date > -1 ) { date.setDate(d.date); } 
				}
				if ( d.yday !== false ) { date.setD(1,0).setD(2,1).adj(2,(d.yday-1)); }
				if ( d.wday !== false ) { date.adj(2,(d.wday - date.getDay())); }
			}
			return date;
		},
		_customformat: {
			'default': function(oper, date) { return false; }
		},
		_formatter: function(format, date) {
			var w = this,
				o = this.options, tmp,
				dur = {
					part: [0,0,0,0], tp: 0
				};
				
				if ( o.mode === 'durationbox' || o.mode === 'durationflipbox' ) {
					dur.tp = this.theDate.getEpoch() - this.initDate.getEpoch();
					dur.part[0] = parseInt( dur.tp / (60*60*24),10); dur.tp -=(dur.part[0]*60*60*24); // Days
					dur.part[1] = parseInt( dur.tp / (60*60),10); dur.tp -= (dur.part[1]*60*60); // Hours
					dur.part[2] = parseInt( dur.tp / (60),10); dur.tp -= (dur.part[2]*60); // Minutes
					dur.part[3] = dur.tp; // Seconds
			
					if ( ! format.match(/%Dd/) ) { dur.part[1] += (dur.part[0]*24);}
					if ( ! format.match(/%Dl/) ) { dur.part[2] += (dur.part[1]*60);}
					if ( ! format.match(/%DM/) ) { dur.part[3] += (dur.part[2]*60);}
				}
				
			format = format.replace(/%(D|X|0|-)*([1-9a-zA-Z])/g, function(match, pad, oper) {
				if ( pad === 'X' ) {
					if ( typeof w._customformat[o.mode] !== 'undefined' ) { return w._customformat[o.mode](oper, date, o); }
					return match;
				}
				if ( pad === 'D' ) {
					switch ( oper ) {
						case 'd': return dur.part[0];
						case 'l': return w._zPad(dur.part[1]);
						case 'M': return w._zPad(dur.part[2]);
						case 'S': return w._zPad(dur.part[3]);
						case 'A': return ((dur.part[0] > 1)?w.__('durationDays')[1]:w.__('durationDays')[0]);
						default: return match;
					}
				}
				switch ( oper ) {
					case '%': // Literal %
						return '%';
					case 'a': // Short Day
						return w.__('daysOfWeekShort')[date.getDay()];
					case 'A': // Full Day of week
						return w.__('daysOfWeek')[date.getDay()];
					case 'b': // Short month
						return w.__('monthsOfYearShort')[date.getMonth()];
					case 'B': // Full month
						return w.__('monthsOfYear')[date.getMonth()];
					case 'C': // Century
						return date.getFullYear().toString().substr(0,2);
					case 'd': // Day of month
						return (( pad === '-' ) ? date.getDate() : w._zPad(date.getDate()));
					case 'H': // Hour (01..23)
					case 'k':
						return (( pad === '-' ) ? date.getHours() : w._zPad(date.getHours()));
					case 'I': // Hour (01..12)
					case 'l':
						return (( pad === '-' ) ? ((date.getHours() === 0 || date.getHours() === 12)?12:((date.getHours()<12)?date.getHours():(date.getHours()-12))) : w._zPad(((date.getHours() === 0 || date.getHours() === 12)?12:((date.getHours()<12)?date.getHours():date.getHours()-12))));
					case 'm': // Month
						return (( pad === '-' ) ? date.getMonth()+1 : w._zPad(date.getMonth()+1));
					case 'M': // Minutes
						return (( pad === '-' ) ? date.getMinutes() : w._zPad(date.getMinutes()));
					case 'p': // AM/PM (ucase)
						return ((date.getHours() < 12)?w.__('meridiem')[0].toUpperCase():w.__('meridiem')[1].toUpperCase());
					case 'P': // AM/PM (lcase)
						return ((date.getHours() < 12)?w.__('meridiem')[0].toLowerCase():w.__('meridiem')[1].toLowerCase());
					case 's': // Unix Seconds
						return date.getEpoch();
					case 'S': // Seconds
						return (( pad === '-' ) ? date.getSeconds() : w._zPad(date.getSeconds()));
					case 'u': // Day of week (1-7)
						return (( pad === '-' ) ? date.getDay() + 1 : w._zPad(date.getDay() + 1));
					case 'w': // Day of week
						return date.getDay();
					case 'y': // Year (2 digit)
						return date.getFullYear().toString().substr(2,2);
					case 'Y': // Year (4 digit)
						return date.getFullYear();
					case 'E': // BE (Buddist Era, 4 Digit)
						return date.getFullYear() + 543;
					case 'V':
						return (( pad === '-' ) ? date.getDWeek(4) : w._zPad(date.getDWeek(4)));
					case 'U':
						return (( pad === '-' ) ? date.getDWeek(0) : w._zPad(date.getDWeek(0)));
					case 'W':
						return (( pad === '-' ) ? date.getDWeek(1) : w._zPad(date.getDWeek(1)));
					case 'o': // Ordinals
						if ( typeof w._ord[o.useLang] !== 'undefined' ) { return w._ord[o.useLang](date.getDate()); }
						return w._ord['default'](date.getDate());
					case 'j':
						tmp = new Date(date.getFullYear(),0,1);
						tmp = Math.ceil((date - tmp) / 86400000)+1;
						return (( tmp < 100 ) ? (( tmp < 10 )? '00' : '0') : '' ) + String(tmp);
					case 'G':
						if ( date.getDWeek(4) === 1 && date.getMonth() > 0 ) { return date.getFullYear() + 1; } 
						if ( date.getDWeek(4) > 51 && date.getMonth() < 11 ) { return date.getFullYear() - 1; }
						return date.getFullYear();
					case 'g':
						if ( date.getDWeek(4) === 1 && date.getMonth() > 0 ) { return parseInt(date.getFullYear().toString().substr(2,2),10) + 1; }
						if ( date.getDWeek(4) > 51 && date.getMonth() < 11 ) { return parseInt(date.getFullYear().toString().substr(2,2),10) - 1; }
						return date.getFullYear().toString().substr(2,2);
					default:
						return match;
				}
			});
		
			if ( w.__('useArabicIndic') === true ) {
				format = w._dRep(format);
			}
		
			return format;
		},
		_btwn: function(value, low, high) {
			return ( value > low && value < high );
		},
		_minStepFix: function() {
			var tempMin = this.theDate.get(4), tmp,
				w = this,
				o = this.options;
				
			if ( o.minuteStep > 1 && tempMin % o.minuteStep > 0 ) {
				if ( o.minuteStepRound < 0 ) {
					tempMin = tempMin - (tempMin % o.minuteStep);
				} else if ( o.minStepRound > 0 ) {
					tempMin = tempMin + ( o.minuteStep - ( tempMin % o.minuteStep ) );
				} else {
					if ( tempMin % o.minuteStep < o.minuteStep / 2 ) {
						tempMin = tempMin - (tempMin % o.minuteStep);
					} else {
						tempMin = tempMin + ( o.minuteStep - ( tempMin % o.minuteStep ) );
					}
				}
			w.theDate.setMinutes(tempMin);
			}
		},
		_offset: function(mode, amount, update) {
			// Compute a date/time offset.
			//   update = false to prevent controls refresh
			var w = this,
				o = this.options,
				ok = false;
				
			mode = (mode || "").toLowerCase();
				
			if ( typeof(update) === "undefined" ) { update = true; }
			w.d.input.trigger('datebox', {'method':'offset', 'type':mode, 'amount':amount});
			
			if ( mode !== 'a' && ( typeof o.rolloverMode[mode] === 'undefined' || o.rolloverMode[mode] === true )) {
				ok = $.inArray(mode, ['y','m','d','h','i','s']);
			} else {
				switch(mode) {
					case 'y': ok = 0; break;
					case 'm':
						if ( w._btwn(w.theDate.getMonth()+amount,-1,12) ) { ok = 1; }
						break;
					case 'd':
						if ( w._btwn(w.theDate.getDate() + amount,0,(32 - w.theDate.copy([0],[0,0,32,13]).getDate() + 1) )) { ok = 2; }
						break;
					case 'h':
						if ( w._btwn(w.theDate.getHours() + amount,-1,24) ) { ok = 3; }
						break;
					case 'i':
						if ( w._btwn(w.theDate.getMinutes() + amount,-1,60) ) { ok = 4; }
						break;
					case 's':
						if ( w._btwn(w.theDate.getSeconds() + amount,-1,60) ) { ok = 5; }
						break;
					case 'a':
						w._offset('h',((amount>0)?1:-1)*12,false);
						break;
				}
			}
			if ( ok !== false ) { w.theDate.adj(ok,amount); }
			if ( update === true ) { w.refresh(); }
			if ( o.useImmediate ) { w.d.input.trigger('datebox', {'method':'doset'}); }
		},
		_startOffset: function(date) {
			var o = this.options;
			
			if ( o.startOffsetYears !== false ) {
				date.adj(0, o.startOffsetYears);
			}
			if ( o.startOffsetMonths !== false ) {
				date.adj(1, o.startOffsetMonths);
			}
			if ( o.startOffsetDays !== false ) {
				date.adj(2, o.startOffsetDays);
			}
			return date;
		},
		_create: function() {
			// Create the widget, called automatically by widget system
			$( document ).trigger( "dateboxcreate" );
		
			var w = this,
				o = $.extend(this.options, (typeof this.element.jqmData('options') !== 'undefined') ? this.element.jqmData('options') : this._getLongOptions(this.element) ),
				thisTheme = ( o.theme === false && typeof($(this).jqmData('theme')) === 'undefined' ) ?
					( ( typeof(this.element.parentsUntil(':jqmData(theme)').parent().jqmData('theme')) === 'undefined' ) ?
						o.themeDefault : this.element.parentsUntil(':jqmData(theme)').parent().jqmData('theme') )
					: o.theme,
				trans = o.useAnimation ? o.transition : 'none',
				d = o.useNewStyle === false ? {
					input: this.element,
					wrap: this.element.wrap('<div class="ui-input-datebox ui-shadow-inset ui-corner-all '+ (this.element.jqmData("mini") === true ? 'ui-mini ':'') +'ui-body-'+ thisTheme +'"></div>').parent(),
					mainWrap: $("<div>", { "class": 'ui-datebox-container ui-overlay-shadow ui-corner-all ui-datebox-hidden '+trans+' ui-body-'+thisTheme} ).css('zIndex', o.zindex),
					intHTML: false
				} : {
					input: this.element,
					wrap: this.element,
					mainWrap: $("<div>", { "class": 'ui-datebox-container ui-overlay-shadow ui-corner-all ui-datebox-hidden '+trans+' ui-body-'+thisTheme} ).css('zIndex', o.zindex),
					intHTML: false
				},
				touch = ( typeof window.ontouchstart !== 'undefined' ),
				drag = {
					eStart : (touch ? 'touchstart' : 'mousedown')+'.datebox',
					eMove  : (touch ? 'touchmove' : 'mousemove')+'.datebox',
					eEnd   : (touch ? 'touchend' : 'mouseup')+'.datebox',
					eEndA  : (touch ? 'mouseup.datebox touchend.datebox touchcancel.datebox touchmove.datebox' : 'mouseup.datebox'),
					move   : false,
					start  : false,
					end    : false,
					pos    : false,
					target : false,
					delta  : false,
					tmp    : false
				},
				calc = { },
				ns = (typeof $.mobile.ns !== 'undefined')?$.mobile.ns:'';
				
			$.extend(w, {d: d, ns: ns, drag: drag, touch:touch});
			
			if ( o.usePlaceholder !== false ) {
				if ( o.usePlaceholder === true && w._grabLabel() !== false ) { w.d.input.attr('placeholder', w._grabLabel()); }
				if ( typeof o.usePlaceholder === 'string' ) { w.d.input.attr('placeholder', o.usePlaceholder); }
			}
			
			o.theme = thisTheme;
			
			w.clearFunc = false;
			w.disabled = false;
			w.runButton = false;
			w._date = window.Date;
			w._enhanceDate();
			w.baseID = w.d.input.attr('id');
			
			w.initDate = new w._date();
			w.theDate = (o.defaultValue) ? w._makeDate(o.defaultValue) : ( (w.d.input.val() !== "") ? w._makeDate(w.d.input.val()) : new w._date() );
			w.initDone = false;

			if ( o.showInitialValue === true ) {
				w.d.input.val(w._formatter(w.__fmt(), w.theDate));
			}
			
			if ( o.useButton === true && o.useInline === false && o.useNewStyle === false ) {
				w.d.open = $('<a href="#" class="ui-input-clear" title="'+this.__('tooltip')+'">'+this.__('tooltip')+'</a>')
					.on(o.clickEvent, function(e) {
						e.preventDefault();
						if ( o.useFocus === true ) { w.d.input.focus(); }
						else {
							if ( !w.disabled ) { w.d.input.trigger('datebox', {'method': 'open'}); w.d.wrap.parent().addClass('ui-focus'); w.d.input.parent().removeClass('ui-focus'); }
						}
						setTimeout( function() { $(e.target).closest('a').removeClass($.mobile.activeBtnClass); }, 300);
					}).appendTo(w.d.wrap).buttonMarkup({icon: 'grid', iconpos: 'notext', corners:true, shadow:true})
					.css({'vertical-align': 'middle', 'display': 'inline-block'});
			}
			
			w.d.screen = $("<div>", {'class':'ui-datebox-screen ui-datebox-hidden'+((o.useModal)?' ui-datebox-screen-modal':'')})
				.css({'z-index': o.zindex-1})
				.on(o.clickEventAlt, function(e) {
					e.preventDefault();
					w.d.input.trigger('datebox', {'method':'close'});
				});
			
			if ( o.enhanceInput === true && navigator.userAgent.match(/Android/i) ){
				w.inputType = 'number';
			} else {
				w.inputType = 'text';
			}
			
			if ( o.hideInput ) { w.d.wrap.parent().hide(); }
		
			if ( o.mobVer < 140 ) {
				$('label[for=\''+w.d.input.attr('id')+'\']').addClass('ui-input-text').css('verticalAlign', 'middle');
			}

			w.d.wrap.on(o.clickEvent, function() {
				if ( !w.disabled && ( o.noButtonFocusMode || o.focusMode ) ) { 
					w.d.input.trigger('datebox', {'method': 'open'});
					w.d.wrap.addClass('ui-focus');
					w.d.input.removeClass('ui-focus');
				}
			});

			w.d.input
				.removeClass('ui-corner-all ui-shadow-inset')
				.bind(w.touch?'touchend':'click', function(e){
					if ( w.disabled === false && o.useNewStyle === true && o.useFocus === false ) {
						if ( ((w.touch ? e.originalEvent.changedTouches[0].pageX : e.pageX) - e.target.offsetLeft) > (e.target.offsetWidth - 20) ) {
							w.d.input.trigger('datebox', {'method': 'open'}); w.d.wrap.parent().addClass('ui-focus'); w.d.input.removeClass('ui-focus');
							//setTimeout(function(){w.d.wrap.addClass('ui-focus');}, 200);
						}
					}
				})
				.focus(function(){
					if ( w.disabled === false && o.useFocus === true ) {
						w.d.input.trigger('datebox', {'method': 'open'}); w.d.wrap.addClass('ui-focus'); w.d.input.removeClass('ui-focus');
						if ( o.useNewStyle === false ) { w.d.input.parent().removeClass('ui-focus'); w.d.wrap.parent().addClass('ui-focus'); }
					} 
					if ( o.useNewStyle === false ) { w.d.input.removeClass('ui-focus'); }
				})
				.blur(function(){
					w.d.wrap.removeClass('ui-focus');
					w.d.input.removeClass('ui-focus');
				})
				.change(function() {
					w.theDate = w._makeDate(w.d.input.val());
					w.refresh();
				})
				.on('datebox', w._event);
				
			if ( o.lockInput === true ) { w.d.input.attr("readonly", "readonly"); }
			
			if ( o.useNewStyle === true ) {
				w.d.input.addClass('ui-corner-all '+((o.useAltIcon===true)?'ui-icon-datebox-alt':'ui-icon-datebox'));
				if ( o.overrideStyleClass !== false ) { w.d.input.addClass(o.overrideStyleClass); }
			} else {
				w.d.input.parent().css('border', 'none').removeClass('ui-shadow-inset');
			}
			
			w.d.wrap.parent().on(o.clickEvent, function() {
				if ( !w.disabled && o.useFocus === true && o.useNewStyle === false ) {
					w.d.input.trigger('datebox', {'method': 'open'}); w.d.wrap.addClass('ui-focus'); w.d.input.removeClass('ui-focus');
					setTimeout(function(){
						w.d.wrap.removeClass('ui-focus');
						w.d.wrap.parent().addClass('ui-focus');
					}, 500);
				}
			});

			// Check if mousewheel plugin is loaded
			if ( typeof $.event.special.mousewheel !== 'undefined' ) { w.wheelExists = true; }
		
			// Disable when done if element attribute disabled is true.
			if ( w.d.input.is(':disabled') ) {
				w.disable();
			}
			
			if ( o.useInline === true || o.useInlineBlind ) { w.open(); }
			
			w.applyMinMax(false, false);
			
			//Throw dateboxinit event
			$( document ).trigger( "dateboxaftercreate" );
		},
		applyMinMax: function(refresh, override) {
			var w = this,
					o = this.options,
					calc = {};
					
			if ( typeof refresh === 'undefined' ) { refresh = false; }
			if ( typeof override === 'undefined' ) { override = true; }
			
			if ( ( override === true || o.minDays === false ) && typeof(w.d.input.attr('min')) !== 'undefined' ) {
				calc.today  = new w._date();
				calc.lod    = 24 * 60 * 60 * 1000;
				calc.todayc = new w._date(calc.today.getFullYear(), calc.today.getMonth(), calc.today.getDate(), 0,0,0,0);
				calc.fromel = w.d.input.attr('min').split('-');
				calc.compdt  = new w._date(calc.fromel[0],calc.fromel[1]-1,calc.fromel[2],0,0,0,0);
				o.minDays = parseInt((((calc.compdt.getTime() - calc.todayc.getTime()) / calc.lod))*-1,10);
			}
			if ( ( override === true || o.maxDays === false ) && typeof(w.d.input.attr('max')) !== 'undefined' ) {
				calc.today  = new w._date();
				calc.lod    = 24 * 60 * 60 * 1000;
				calc.todayc = new w._date(calc.today.getFullYear(), calc.today.getMonth(), calc.today.getDate(), 0,0,0,0);
				calc.fromel = w.d.input.attr('max').split('-');
				calc.compdt  = new w._date(calc.fromel[0],calc.fromel[1]-1,calc.fromel[2],0,0,0,0);
				o.maxDays = parseInt((((calc.compdt.getTime() - calc.todayc.getTime()) / calc.lod)),10);
			}
			
			if ( refresh === true ) { w.refresh(); }
		},
		_build: {
			'default': function () {
				this.d.headerText = "Error";
				this.d.intHTML = $("<div class='ui-body-b'><h2 style='text-align:center'>There is no mode by that name loaded / mode not given</h2></div>");
			}
		},
		_applyCoords: function(e) {
			var w = e.widget,
				o = e.widget.options,
				fixd = {
					h: $.mobile.activePage.find('.ui-header').jqmData('position'),
					f: $.mobile.activePage.find('.ui-footer').jqmData('position'),
					fh: $.mobile.activePage.find('.ui-footer').outerHeight(),
					hh: $.mobile.activePage.find('.ui-header').outerHeight()
				},
				iput = {
					x: w.d.wrap.offset().left + (w.d.wrap.outerWidth() / 2),
					y: w.d.wrap.offset().top + (w.d.wrap.outerHeight() / 2)
				},
				size = {
					w: w.d.mainWrap.outerWidth(),
					h: w.d.mainWrap.outerHeight()
				},
				doc = {
					t: $(window).scrollTop(),
					h: $(window).height(),
					w: $.mobile.activePage.width(),
					ah: $(document).height()
				},
				pos = {
					y: (o.centerVert) ? doc.t + ((doc.h / 2) - (size.h / 2)) : iput.y  - ( size.h / 2 ),
					x: (doc.w < 400 || o.centerHoriz ) ? (doc.w / 2) - (size.w /2) : iput.x  - (size.w / 2)
				};
				
			if ( o.centerVert === false ) {
				if ( o.hideFixedToolbars === true && ( typeof fixd.f !== 'undefined' || typeof fixd.h !== 'undefined' )) {
					$.mobile.activePage.find(":jqmData(position='fixed')").fixedtoolbar('hide');
					fixd.f = undefined;
					fixd.h = undefined;
				}
				
				if ( typeof fixd.f !== 'undefined' ) {
					if ( ( pos.y + size.h ) > ( doc.h - fixd.fh - 2 ) ) {
						pos.y = doc.h - fixd.fh - 2 - size.h;
					}
				} else {
					if ( ( pos.y + size.h ) > ( doc.ah - fixd.fh - 2 ) ) {
						pos.y = doc.ah - fixd.fh - 2 - size.h;
					}
					if ( ( doc.h + doc.t ) < ( size.h + pos.y + 2 ) ) {
						pos.y = doc.h + doc.t - size.h - 2;
					}
				}
				
				if ( typeof fixd.h !== 'undefined' ) {
					if ( ( doc.t + fixd.hh + 2 ) > pos.y ) {
						pos.y = doc.t + fixd.hh + 2;
					}
				} else {
					if ( fixd.hh + 2 > pos.y ) {
						pos.y = fixd.hh + 2;
					}
					if ( pos.y < doc.t + 2 ) {
						pos.y = doc.t + 2;
					}
				}
			}
			w.d.mainWrap.css({'position': 'absolute', 'top': pos.y, 'left': pos.x});
		},
		_drag: {
			'default': function () { return false; }
		},
		open: function () {
			var w = this,
				o = this.options, 
				popopts = {},
				basepop = {'history':false},
				qns = 'data-'+this.ns,
				trans = o.useAnimation ? o.transition : 'none';
			
			if ( o.useFocus === true && w.fastReopen === true ) { w.d.input.blur(); return false; }
			if ( w.clearFunc !== false ) {
				clearTimeout(w.clearFunc); w.clearFunc = false;
			}
			
			// Call the open callback if provided. Additionally, if this
			// returns false then the open/update will stop.
			if ( o.openCallback !== false ) {
				if ( ! $.isFunction(o.openCallback) ) {
					if ( typeof window[o.openCallback] !== 'undefined' ) {
						o.openCallback = window[o.openCallback];
					} else {
						o.openCallback = new Function(o.openCallback);
					}
				}
				if ( o.openCallback.apply(w, $.merge([w.theDate],o.openCallbackArgs)) === false ) { return false; }
			}
				
			w.theDate = w._makeDate(w.d.input.val());
			if ( w.d.input.val() === "" ) { w._startOffset(w.theDate); }
			w.d.input.blur();
			
			if ( typeof w._build[o.mode] === 'undefined' ) {
				w._build['default'].apply(w,[]);
			} else {
				w._build[o.mode].apply(w,[]);
			}
			if ( typeof w._drag[o.mode] !== 'undefined' ) {
				w._drag[o.mode].apply(w, []);
			}
			w.d.input.trigger('datebox', {'method':'refresh'});
			if ( w.__('useArabicIndic') === true ) { w._doIndic(); }
			
			if ( ( o.useInline === true || o.useInlineBlind === true ) && w.initDone === false ) {
				w.d.mainWrap.append(w.d.intHTML);
				if ( o.useInline === true && o.hideInput === true ) {
					w.d.input.parent().parent().parent().append(w.d.mainWrap);
				} else {
					w.d.input.parent().parent().append(w.d.mainWrap);
				}
				w.d.mainWrap.removeClass('ui-datebox-hidden');
				if ( o.useInline === true ) {
					if ( o.hideInput === true ) {
						w.d.mainWrap.addClass('ui-datebox-inline');
					} else {
						w.d.mainWrap.addClass('ui-datebox-inlineblind');
					}
				} else {
					w.d.mainWrap.addClass('ui-datebox-inlineblind');
					w.d.mainWrap.hide();
				}
				w.initDone = false;
				w.d.input.trigger('datebox',{'method':'postrefresh'});
			}
			
			if ( o.useInline ) { return true; }
			if ( o.useInlineBlind ) { 
				if ( w.initDone ) { w.refresh(); w.d.mainWrap.slideDown();  }
				else { w.initDone = true; }
				return true;
			}
			
			if ( w.d.intHTML.is(':visible') ) { return false; } // Ignore if already open
				
			if ( o.enablePopup === true ) {
				w.d.dialogPage = false;
				w.d.mainWrap.empty();
				if ( o.useHeader === true ) {
					w.d.headHTML = $('<div class="ui-header ui-bar-'+o.themeHeader+'"></div>');
					$("<a class='ui-btn-left' href='#'>Close</a>").appendTo(w.d.headHTML)
						.buttonMarkup({ theme  : o.themeHeader, icon   : 'delete', iconpos: 'notext', corners: true, shadow : true })
						.on(o.clickEventAlt, function(e) { e.preventDefault(); w.d.input.trigger('datebox', {'method':'close'}); });
					$('<h1 class="ui-title">'+w.d.headerText+'</h1>').appendTo(w.d.headHTML);
					w.d.mainWrap.append(w.d.headHTML);
				}
				w.d.mainWrap.append(w.d.intHTML).css('zIndex', o.zindex);
				w.d.input.trigger('datebox',{'method':'postrefresh'});
				
				if ( o.useAnimation === true ) {
					popopts.transition = o.transition;
				} else {
					popopts.transition = "none";
				}
				
				if ( o.popupForceX !== false && o.popupForceY !== false ) {
					popopts.x = o.popupForceX;
					popopts.y = o.popupForceY;
				}
				
				if ( o.popupPosition !== false ) {
					popopts.positionTo = o.popupPosition;
				} else {
					if ( typeof w.baseID !== undefined ) {
						popopts.positionTo = '#' + w.baseID;
					} else {
						popopts.positionTo = 'window';
					}
				}
				
				if ( o.useModal === true ) { basepop.overlayTheme = "a"; }
				
				w.d.mainWrap.removeClass('ui-datebox-hidden').popup(basepop).popup("open", popopts);
				w.refresh();
			} else {
				if ( o.dialogForce || ( o.dialogEnable && window.width() < 400 ) ) {
					w.d.dialogPage = $("<div "+qns+"role='dialog' "+qns+"theme='"+o.theme+"' >" +
						"<div "+qns+"role='header' "+qns+"theme='"+o.themeHeader+"'>" +
						"<h1>"+w.d.headerText+"</h1></div><div "+qns+"role='content'></div>")
						.appendTo( $.mobile.pageContainer )
						.page().css('minHeight', '0px').addClass(trans);
					w.d.dialogPage.find('.ui-header').find('a').off('click vclick').on(o.clickEventAlt, function(e) { e.preventDefault(); w.d.input.trigger('datebox', {'method':'close'}); });
					w.d.mainWrap.append(w.d.intHTML).css({'marginLeft':'auto', 'marginRight':'auto'}).removeClass('ui-datebox-hidden');
					w.d.dialogPage.find('.ui-content').append(w.d.mainWrap);
					w.d.input.trigger('datebox',{'method':'postrefresh'});
					$.mobile.activePage.off( "pagehide.remove" );
					$.mobile.changePage(w.d.dialogPage, {'transition': trans});
				} else {
					w.d.dialogPage = false;
					w.d.mainWrap.empty();
					if ( o.useHeader === true ) {
						w.d.headHTML = $('<div class="ui-header ui-bar-'+o.themeHeader+'"></div>');
						$("<a class='ui-btn-left' href='#'>Close</a>").appendTo(w.d.headHTML)
							.buttonMarkup({ theme  : o.themeHeader, icon   : 'delete', iconpos: 'notext', corners: true, shadow : true })
							.on(o.clickEventAlt, function(e) { e.preventDefault(); w.d.input.trigger('datebox', {'method':'close'}); });
						$('<h1 class="ui-title">'+w.d.headerText+'</h1>').appendTo(w.d.headHTML);
						w.d.mainWrap.append(w.d.headHTML);
					}
					w.d.mainWrap.append(w.d.intHTML).css('zIndex', o.zindex);
					w.d.mainWrap.appendTo($.mobile.activePage);
					w.d.screen.appendTo($.mobile.activePage);
					w.d.input.trigger('datebox',{'method':'postrefresh'});
					w._applyCoords({widget:w});
					
					if ( o.useModal === true ) { 
						if(o.useAnimation) {
							w.d.screen.fadeIn('slow');
						} else {
							w.d.screen.show();
						}
					} else {
						setTimeout(function () { w.d.screen.removeClass('ui-datebox-hidden');}, 500);
					}
					
					w.d.mainWrap.addClass('ui-overlay-shadow in').removeClass('ui-datebox-hidden');
					
					$(document).on('orientationchange.datebox', {widget:w}, function(e) { w._applyCoords(e.data); });
					if ( o.resizeListener === true ) {
						$(window).on('resize.datebox', {widget:w}, function (e) { w._applyCoords(e.data); });
					}
				}
			}
		},
		close: function() {
			var w = this,
				o = this.options;
			
			if ( o.useInlineBlind === true ) { w.d.mainWrap.slideUp(); return true;}
			if ( o.useInline === true || w.d.intHTML === false ) { return true; }

			if ( w.d.dialogPage !== false ) {
				$(w.d.dialogPage).dialog('close');
				
				if ( ! $.mobile.activePage.data('mobile-page').options.domCache ) {
					$.mobile.activePage.on('pagehide.remove', function () { $(this).remove(); });
				}
				
				w.d.intHTML.detach().empty();
				w.d.mainWrap.detach().empty();
				w.d.wrap.removeClass('ui-focus');
				w.clearFunc = setTimeout(function () { w.d.dialogPage.empty().remove(); w.clearFunc = false; }, 1500);
			} else {
				if ( o.enablePopup === true ) {
					w.d.mainWrap.popup('close');
					w.d.wrap.removeClass('ui-focus');
				} else {
					if ( o.useModal ) {
						if(o.useAnimation) {
							w.d.screen.fadeOut('slow');
						} else {
							w.d.screen.hide();
						}
					} else {
						w.d.screen.addClass('ui-datebox-hidden');
					}
					w.d.screen.detach();
					w.d.mainWrap.addClass('ui-datebox-hidden').removeAttr('style').removeClass('in ui-overlay-shadow').empty().detach();
					w.d.intHTML.detach();
					w.d.wrap.removeClass('ui-focus');
					
					$(document).off('orientationchange.datebox');
					if ( o.resizeListener === true ) {
						$(window).off('resize.datebox');
					}
				}
			}
			w.d.wrap.parent().removeClass('ui-focus');
					
			$(document).off(w.drag.eMove);
			$(document).off(w.drag.eEnd);
			$(document).off(w.drag.eEndA);
			
			if ( o.useFocus ) { 
				w.fastReopen = true;
				setTimeout(function(t) { return function () { t.fastReopen = false; };}(w), 300);
			}
			
			if ( o.closeCallback !== false ) {
				if ( ! $.isFunction(o.closeCallback) ) {
					if ( typeof window[o.closeCallback] !== 'undefined' ) {
						o.closeCallback = window[o.closeCallback];
					} else {
						o.closeCallback = new Function(o.closeCallback);
					}
				}
				o.closeCallback.apply(w, $.merge([w.theDate], o.closeCallbackArgs));
			}
		},
		refresh: function() {
			if ( typeof this._build[this.options.mode] === 'undefined' ) {
				this._build['default'].apply(this,[]);
			} else {
				this._build[this.options.mode].apply(this,[]);
			}
			if ( this.__('useArabicIndic') === true ) { this._doIndic(); }
			this.d.mainWrap.append(this.d.intHTML);
			this.d.input.trigger('datebox',{'method':'postrefresh'});
		},
		_check: function() {
			var w = this,
				td = null, 
				o = this.options;
			
			w.dateOK = true;
			
			if ( o.afterToday !== false ) {
				td = new w._date();
				if ( w.theDate < td ) { w.theDate = td; }
			}
			if ( o.beforeToday !== false ) {
				td = new w._date();
				if ( w.theDate > td ) { w.theDate = td; }
			}
			if ( o.maxDays !== false ) {
				td = new w._date();
				td.adj(2, o.maxDays);
				if ( w.theDate > td ) { w.theDate = td; }
			}
			if ( o.minDays !== false ) {
				td = new w._date();
				td.adj(2, -1*o.minDays);
				if ( w.theDate < td ) { w.theDate = td; }
			}
			if ( o.minHour !== false ) {
				if ( w.theDate.getHours() < o.minHour ) {
					w.theDate.setHours(o.minHour);
				}
			}
			if ( o.maxHour !== false ) {
				if ( w.theDate.getHours() > o.maxHour ) {
					w.theDate.setHours(o.maxHour);
				}
			}
			if ( o.maxYear !== false ) {
				td = new w._date(o.maxYear, 0, 1);
				td.adj(2, -1);
				if ( w.theDate > td ) { w.theDate = td; }
			}
			if ( o.minYear !== false ) {
				td = new w._date(o.minYear, 0, 1);
				if ( w.theDate < td ) { w.theDate = td; }
			}
			
			if ( $.inArray(o.mode, ['timebox','durationbox','durationflipbox','timeflipbox']) > -1 ) { 
				if ( o.mode === 'timeflipbox' && o.validHours !== false ) {
					if ( $.inArray(w.theDate.getHours(), o.validHours) < 0 ) { w.dateOK = false; }
				}
			} else {
				if ( o.blackDatesRec !== false ) {
					for ( i=0; i<o.blackDatesRec.length; i++ ) {
						if ( 
							( o.blackDatesRec[i][0] === -1 || o.blackDatesRec[i][0] === year ) &&
							( o.blackDatesRec[i][1] === -1 || o.blackDatesRec[i][1] === month ) &&
							( o.blackDatesRec[i][2] === -1 || o.blackDatesRec[i][2] === date )
						) { w.dateOK = false; } 
					}
				}	
				if ( o.blackDates !== false ) {
					if ( $.inArray(w.theDate.iso(), o.blackDates) > -1 ) { w.dateOK = false; }
				}
				if ( o.blackDays !== false ) {
					if ( $.inArray(w.theDate.getDay(), o.blackDays) > -1 ) { w.dateOK = false; }
				}
			}
		},
		_grabLabel: function() {
			var w = this,
				o = this.options,
				par = {'oldd': false, 'newd': false};
				
			if ( typeof o.overrideDialogLabel === 'undefined' ) {
				if ( typeof w.d.input.attr('placeholder') !== 'undefined' ) { return w.d.input.attr('placeholder'); }
				if ( typeof w.d.input.attr('title') !== 'undefined' ) { return w.d.input.attr('title'); }
				par.newd = w.d.wrap.parent().parent().find('label[for=\''+w.d.input.attr('id')+'\']').text();
				par.oldd = w.d.wrap.parent().find('label[for=\''+w.d.input.attr('id')+'\']').text();
				if ( par.oldd !== '' && par.oldd !== false ) { return par.oldd; }
				if ( par.newd !== '' && par.newd !== false ) { return par.newd; }
				return false;
			}
			return o.overrideDialogLabel;
		},
		_makeEl: function(source, parts) {
			var part = false,
				retty = false;
			
			retty = source.clone();
			
			if ( typeof parts.attr !== 'undefined' ) {
				for ( part in parts.attr ) {
					if ( parts.attr.hasOwnProperty(part) ) {
						retty.jqmData(part, parts.attr[part]);
					}
				}
			}
			return retty;
		},
		_getLongOptions: function(element) {
			var key, retty = {}, prefix, temp;
			
			if ( $.mobile.ns === "" ) { 
				prefix = "datebox";
			} else { 
				prefix = $.mobile.ns.substr(0, $.mobile.ns.length - 1) + 'Datebox';
			}
			
			for ( key in element.data() ) {
				if ( key.substr(0, prefix.length) === prefix && key.length > prefix.length ) {
					temp = key.substr(prefix.length);
					temp = temp.charAt(0).toLowerCase() + temp.slice(1);
					retty[temp] = element.data(key);
				}
			}
			return retty;
		},
		disable: function(){
			// Disable the element
			this.d.input.attr("disabled",true);
			this.d.wrap.addClass("ui-disabled").blur();
			this.disabled = true;
			this.d.input.trigger('datebox', {'method':'disable'});
		},
		enable: function(){
			// Enable the element
			this.d.input.attr("disabled", false);
			this.d.wrap.removeClass("ui-disabled");
			this.disabled = false;
			this.d.input.trigger('datebox', {'method':'enable'});
		},
		_setOption: function() {
			$.Widget.prototype._setOption.apply( this, arguments );
			this.refresh();
		},
		getTheDate: function() {
			return this.theDate;
		},
		getLastDur: function() {
			return this.lastDuration;
		},
		setTheDate: function(newDate) {
			this.theDate = newDate;
			this.refresh();
			this.d.input.trigger('datebox', { 'method': 'doset' });
		},
		callFormat: function(format, date) {
			return this._formatter(format, date);
		},
		getOption: function(opt) {
			var problang = this.__(opt);
			if ( typeof(problang) !== 'undefined' ) {
				return problang;
			} else {
				return this.options[opt];
			}
		}
	});
	  
	// Degrade date inputs to text inputs, suppress standard UI functions.
	$( document ).on( "pagebeforecreate", function( e ) {
		$( ":jqmData(role='datebox')", e.target ).each(function() {
			$(this).prop('type', 'text');
		});
	});
	// Automatically bind to data-role='datebox' items.
	$( document ).on( "pagecreate create", function( e ){
		$( document ).trigger( "dateboxbeforecreate" );
		$( ":jqmData(role='datebox')", e.target ).each(function() {
			var defed = typeof ($(this).data(parseInt($.mobile.version.replace(/\./g,''),10) > 111 ? 'mobile-datebox' : 'datebox'));
			if ( defed === "undefined" ) {
				$(this).datebox();
			}
		});
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
/* CALBOX Mode */
// Version Notes: <140 :: New button theme method, still use _hoover

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeDateToday: 'b',
		themeDayHigh: 'b',
		themeDatePick: 'b',
		themeDateHigh: 'b',
		themeDateHighAlt: 'b',
		themeDateHighRec: 'b',
		themeDate: 'a',
		
		calHighToday: true,
		calHighPick: true,
		
		calShowDays: true,
		calOnlyMonth: false,
		calWeekMode: false,
		calWeekModeDay: 1,
		calWeekHigh: false,
		calControlGroup: false,
		calShowWeek: false,
		calUsePickers: false,
		calNoHeader: false,
		
		calYearPickMin: -6,
		calYearPickMax: 6,
		
		useTodayButton: false,
		useTomorrowButton: false,
		useCollapsedBut: false,
		
		highDays: false,
		highDates: false,
		highDatesRec: false,
		highDatesAlt: false,
		enableDates: false,
		calDateList: false,
		calShowDateList: false,
	});
	$.extend( $.mobile.datebox.prototype, {
		_cal_gen: function (start,prev,last,other,month) {
			var rc = 0, cc = 0, day = 1, 
				next = 1, cal = [], row = [], stop = false;
				
			for ( rc = 0; rc <= 5; rc++ ) {
				if ( stop === false ) {
					row = [];
					for ( cc = 0; cc <= 6; cc++ ) {
						if ( rc === 0 && cc < start ) {
							if ( other === true ) {
								row.push([prev + (cc - start) + 1,month-1]);
							} else {
								row.push(false);
							}
						} else if ( rc > 3 && day > last ) {
							if ( other === true ) {
								row.push([next,month+1]); next++;
							} else {
								row.push(false);
							}
							stop = true;
						} else {
							row.push([day,month]); day++;
							if ( day > last ) { stop = true; }
						}
					}
					cal.push(row);
				}
			}
			return cal;
		},
		_cal_check : function (cal, year, month, date) {
			var w = this, i,
				o = this.options,
				ret = {},
				day = new this._date(year,month,date,0,0,0,0).getDay();
				
			ret.ok = true;
			ret.iso = year + '-' + w._zPad(month+1) + '-' + w._zPad(date);
			ret.comp = parseInt(ret.iso.replace(/-/g, ''),10);
			ret.theme = o.themeDate;
			ret.recok = true;
			ret.rectheme = false;
			
			if ( o.blackDatesRec !== false ) {
				for ( i=0; i<o.blackDatesRec.length; i++ ) {
					if ( 
						( o.blackDatesRec[i][0] === -1 || o.blackDatesRec[i][0] === year ) &&
						( o.blackDatesRec[i][1] === -1 || o.blackDatesRec[i][1] === month ) &&
						( o.blackDatesRec[i][2] === -1 || o.blackDatesRec[i][2] === date )
					) { ret.recok = false; } 
				}
			}
			
			if ( $.isArray(o.enableDates) && $.inArray(ret.iso, o.enableDates) < 0 ) {
				ret.ok = false;
			} else if ( cal.checkDates ) {
				if (
					( ret.recok !== true ) ||
					( o.afterToday === true && cal.thisDate.comp() > ret.comp ) ||
					( o.beforeToday === true && cal.thisDate.comp() < ret.comp ) ||
					( o.notToday === true && cal.thisDate.comp() === ret.comp ) ||
					( o.maxDays !== false && cal.maxDate.comp() < ret.comp ) ||
					( o.minDays !== false && cal.minDate.comp() > ret.comp ) ||
					( $.isArray(o.blackDays) && $.inArray(day, o.blackDays) > -1 ) ||
					( $.isArray(o.blackDates) && $.inArray(ret.iso, o.blackDates) > -1 ) 
				) {
					ret.ok = false;
				}
			}
			if ( ret.ok ) {
				if ( o.highDatesRec !== false ) {
					for ( i=0; i<o.highDatesRec.length; i++ ) {
						if ( 
							( o.highDatesRec[i][0] === -1 || o.highDatesRec[i][0] === year ) &&
							( o.highDatesRec[i][1] === -1 || o.highDatesRec[i][1] === month ) &&
							( o.highDatesRec[i][2] === -1 || o.highDatesRec[i][2] === date )
						) { ret.rectheme = true; } 
					}
				}
				
				if ( o.calHighPick && date === cal.presetDay && ( w.d.input.val() !== "" | o.defaultValue !== false )) {
					ret.theme = o.themeDatePick;
				} else if ( o.calHighToday && ret.comp === cal.thisDate.comp() ) {
					ret.theme = o.themeDateToday;
				} else if ( $.isArray(o.highDatesAlt) && ($.inArray(ret.iso, o.highDatesAlt) > -1) ) {
					ret.theme = o.themeDateHighAlt;
				} else if ( $.isArray(o.highDates) && ($.inArray(ret.iso, o.highDates) > -1) ) {
					ret.theme = o.themeDateHigh;
				} else if ( $.isArray(o.highDays) && ($.inArray(day, o.highDays) > -1) ) {
					ret.theme = o.themeDayHigh;
				} else if ( $.isArray(o.highDatesRec) && ret.rectheme === true ) {
					ret.theme = o.themeDateHighRec;
				}
			}
			return ret;
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'calbox': function () {
			var w = this,
				o = this.options, i,
				cal = false,
				uid = 'ui-datebox-',
				temp = false, row = false, col = false, hRow = false, checked = false, prange = {};
				
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.remove();
			}
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():w.__('titleDateDialogLabel'));
			w.d.intHTML = $('<span>');

			$('<div class="'+uid+'gridheader"><div class="'+uid+'gridlabel"><h4>' +
				w._formatter(w.__('calHeaderFormat'), w.theDate) +
				'</h4></div></div>').appendTo(w.d.intHTML);
				
			// Previous and next month buttons, define booleans to decide if they should do anything
			$("<div class='"+uid+"gridplus"+(w.__('isRTL')?'-rtl':'')+"'><a href='#'>"+w.__('nextMonth')+"</a></div>")
				.prependTo(w.d.intHTML.find('.'+uid+'gridheader'))
				.buttonMarkup({theme: o.themeDate, icon: 'arrow-r', inline: true, iconpos: 'notext', corners:true, shadow:true})
				.on(o.clickEventAlt, function(e) {
					e.preventDefault();
					if ( w.calNext ) {
						if ( w.theDate.getDate() > 28 ) { w.theDate.setDate(1); }
						w._offset('m',1);
					}
				});
			$("<div class='"+uid+"gridminus"+(w.__('isRTL')?'-rtl':'')+"'><a href='#'>"+w.__('prevMonth')+"</a></div>")
				.prependTo(w.d.intHTML.find('.'+uid+'gridheader'))
				.buttonMarkup({theme: o.themeDate, icon: 'arrow-l', inline: true, iconpos: 'notext', corners:true, shadow:true})
				.on(o.clickEventAlt, function(e) {
					e.preventDefault();
					if ( w.calPrev ) {
						if ( w.theDate.getDate() > 28 ) { w.theDate.setDate(1); }
						w._offset('m',-1);
					}
				});
				
			if ( o.calNoHeader === true ) { w.d.intHTML.find('.'+uid+'gridheader').remove(); }
			
			cal = {'today': -1, 'highlightDay': -1, 'presetDay': -1, 'startDay': w.__('calStartDay'),
				'thisDate': new w._date(), 'maxDate': w.initDate.copy(), 'minDate': w.initDate.copy(),
				'currentMonth': false, 'weekMode': 0, 'weekDays': null };
			cal.start = (w.theDate.copy([0],[0,0,1]).getDay() - w.__('calStartDay') + 7) % 7;
			cal.thisMonth = w.theDate.getMonth();
			cal.thisYear = w.theDate.getFullYear();
			cal.wk = w.theDate.copy([0],[0,0,1]).adj(2,(-1*cal.start)+(w.__('calStartDay')===0?1:0)).getDWeek(4);
			cal.end = 32 - w.theDate.copy([0],[0,0,32,13]).getDate();
			cal.lastend = 32 - w.theDate.copy([0,-1],[0,0,32,13]).getDate();
			cal.presetDate = (w.d.input.val() === "") ? w._startOffset(w._makeDate(w.d.input.val())) : w._makeDate(w.d.input.val());
			cal.thisDateArr = cal.thisDate.getArray();
			cal.theDateArr = w.theDate.getArray();
			cal.checkDates = ( $.inArray(false, [o.afterToday, o.beforeToday, o.notToday, o.maxDays, o.minDays, o.blackDates, o.blackDays]) > -1 );

			w.calNext = true;
			w.calPrev = true;
			
			if ( cal.thisDateArr[0] === cal.theDateArr[0] && cal.thisDateArr[1] === cal.theDateArr[1] ) { cal.currentMonth = true; } 
			if ( cal.presetDate.comp() === w.theDate.comp() ) { cal.presetDay = cal.presetDate.getDate(); }
			
			if ( o.afterToday === true && 
				( cal.currentMonth === true || ( cal.thisDateArr[1] >= cal.theDateArr[1] && cal.theDateArr[0] === cal.thisDateArr[0] ) ) ) { 
				w.calPrev = false; }
			if ( o.beforeToday === true &&
				( cal.currentMonth === true || ( cal.thisDateArr[1] <= cal.theDateArr[1] && cal.theDateArr[0] === cal.thisDateArr[0] ) ) ) {
				w.calNext = false; }
			
			if ( o.minDays !== false ) {
				cal.minDate.adj(2, -1*o.minDays);
				if ( cal.theDateArr[0] === cal.minDate.getFullYear() && cal.theDateArr[1] <= cal.minDate.getMonth() ) { w.calPrev = false;}
			}
			if ( o.maxDays !== false ) {
				cal.maxDate.adj(2, o.maxDays);
				if ( cal.theDateArr[0] === cal.maxDate.getFullYear() && cal.theDateArr[1] >= cal.maxDate.getMonth() ) { w.calNext = false;}
			}
			
			if ( o.calUsePickers === true ) {
				cal.picker = $('<div>', {'class': 'ui-grid-a ui-datebox-grid','style':'padding-top: 5px; padding-bottom: 5px;'});
				
				cal.picker1 = $('<div class="ui-block-a"><select name="pickmon"></select></div>').appendTo(cal.picker).find('select');
				cal.picker2 = $('<div class="ui-block-b"><select name="pickyar"></select></div>').appendTo(cal.picker).find('select');
				
				for ( i=0; i<=11; i++ ) {
					cal.picker1.append($('<option value="'+i+'"'+((cal.thisMonth===i)?' selected="selected"':'')+'>'+w.__('monthsOfYear')[i]+'</option>'));
				}
				
				if ( o.calYearPickMin < 1 ) { 
					prange.sm = cal.thisYear + o.calYearPickMin;
				} else if ( o.calYearPickMin < 1800 ) {
					prange.sm = cal.thisYear - o.calYearPickMin;
				} else if ( o.calYearPickMin === "NOW" ) {
					prange.sm = cal.thisDate.getFullYear();
				} else {
					prange.sm = o.calYearPickMin;
				}
				
				if ( o.calYearPickMax < 1800 ) {
					prange.lg = cal.thisYear + o.calYearPickMax;
				} else if ( o.calYearPickMax === "NOW" ) {
					prange.lg = cal.thisDate.getFullYear();
				} else {
					prange.lg = o.calYearPickMax;
				}
				for ( i=prange.sm; i<=prange.lg; i++ ) {
					cal.picker2.append($('<option value="'+i+'"'+((cal.thisYear===i)?' selected="selected"':'')+'>'+i+'</option>'));
				}
				
				cal.picker1.on('change', function () {
					w.theDate.setMonth($(this).val());
					if (w.theDate.getMonth() !== parseInt($(this).val(), 10)) {
						w.theDate.setDate(0);
					}
					w.refresh();
				});
				cal.picker2.on('change', function () {
					w.theDate.setFullYear($(this).val());
					if (w.theDate.getMonth() !== parseInt(cal.picker1.val(), 10)) {
						w.theDate.setDate(0);
					}
					w.refresh();
				});
				
				cal.picker.find('select').selectmenu({mini:true, nativeMenu: true});
				cal.picker.appendTo(w.d.intHTML);
			}
			
			temp = $('<div class="'+uid+'grid">').appendTo(w.d.intHTML);
			
			if ( o.calShowDays ) {
				w._cal_days = w.__('daysOfWeekShort').concat(w.__('daysOfWeekShort'));
				cal.weekDays = $("<div>", {'class':uid+'gridrow'}).appendTo(temp);
				if ( w.__('isRTL') === true ) { cal.weekDays.css('direction', 'rtl'); }
				if ( o.calShowWeek ) { 
					$("<div>").addClass(uid+'griddate '+uid+'griddate-empty '+uid+'griddate-label').appendTo(cal.weekDays);
				}
				for ( i=0; i<=6;i++ ) {
					$("<div>"+w._cal_days[(i+cal.startDay)%7]+"</div>").addClass(uid+'griddate '+uid+'griddate-empty '+uid+'griddate-label').appendTo(cal.weekDays);
				}
			}
			
			cal.gen = w._cal_gen(cal.start, cal.lastend, cal.end, !o.calOnlyMonth, w.theDate.getMonth());
			for ( var row=0, rows=cal.gen.length; row < rows; row++ ) {
				hRow = $('<div>', {'class': uid+'gridrow'});
				if ( w.__('isRTL') ) { hRow.css('direction', 'rtl'); }
				if ( o.calShowWeek ) {
						$('<div>', {'class':uid+'griddate '+uid+'griddate-empty'}).text('W'+cal.wk).appendTo(hRow);
						cal.wk++;
						if ( cal.wk > 52 && typeof cal.gen[parseInt(row,10)+1] !== 'undefined' ) { cal.wk = new Date(cal.theDateArr[0],cal.theDateArr[1],((w.__('calStartDay')===0)?cal.gen[parseInt(row,10)+1][1][0]:cal.gen[parseInt(row,10)+1][0][0])).getDWeek(4); }
					} 
				for ( var col=0, cols=cal.gen[row].length; col<cols; col++ ) {
					if ( o.calWeekMode ) { cal.weekMode = cal.gen[row][o.calWeekModeDay][0]; }
					if ( typeof cal.gen[row][col] === 'boolean' ) {
						$('<div>', {'class':uid+'griddate '+uid+'griddate-empty'}).appendTo(hRow);
					} else {
						checked = w._cal_check(cal, cal.theDateArr[0], cal.gen[row][col][1], cal.gen[row][col][0]);
						if (cal.gen[row][col][0]) {
							cal.extcss = ( cal.thisMonth !== cal.gen[row][col][1] && !o.calOnlyMonth ) ? {'cursor':'pointer'} : {};
							$("<div>"+String(cal.gen[row][col][0])+"</div>")
								.addClass( cal.thisMonth === cal.gen[row][col][1] ?
									(uid+'griddate ui-corner-all ui-btn ui-btn-'+(o.mobVer<140?'up-':'')+checked.theme + (checked.ok?'':' '+uid+'griddate-disable')):
									(uid+'griddate '+uid+'griddate-empty')
								)
								.css(cal.extcss)
								.jqmData('date', ((o.calWeekMode)?cal.weekMode:cal.gen[row][col][0]))
								.jqmData('theme', cal.thisMonth === cal.gen[row][col][1] ? checked.theme : '-')
								.jqmData('enabled', checked.ok)
								.jqmData('month', cal.gen[row][((o.calWeekMode)?o.calWeekModeDay:col)][1])
								.appendTo(hRow);
						}
					}
				}
				if ( o.calControlGroup === true ) {
					hRow.find('.ui-corner-all').removeClass('ui-corner-all').eq(0).addClass('ui-corner-left').end().last().addClass('ui-corner-right').addClass('ui-controlgroup-last');
				}
				hRow.appendTo(temp);
			}
			if ( o.calShowWeek ) { temp.find('.'+uid+'griddate').addClass(uid+'griddate-week'); }
			
			if ( o.calShowDateList === true && o.calDateList !== false ) {
				cal.datelist = $('<div>');
				cal.datelistpick = $('<select name="pickdate"></select>').appendTo(cal.datelist);
				
				cal.datelistpick.append('<option value="false" selected="selected">'+w.__('calDateListLabel')+'</option>');
				for ( i=0; i<o.calDateList.length; i++ ) {
					cal.datelistpick.append($('<option value="'+o.calDateList[i][0]+'">'+o.calDateList[i][1]+'</option>'));
				}
				
				cal.datelistpick.on('change', function() {
					cal.datelistdate = $(this).val().split('-');
					w.theDate = new w._date(cal.datelistdate[0], cal.datelistdate[1]-1, cal.datelistdate[2], 0,0,0,0);
					w.d.input.trigger('datebox',{'method':'doset'});
				});
				
				cal.datelist.find('select').selectmenu({mini:true, nativeMenu:true});
				cal.datelist.appendTo(w.d.intHTML);
			}
			
			if ( o.useTodayButton || o.useTomorrowButton || o.useClearButton ) {
				hRow = $('<div>', {'class':uid+'controls'});
				
				if ( o.useTodayButton ) {
					$('<a href="#">'+w.__('calTodayButtonLabel')+'</a>')
						.appendTo(hRow).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEvent, function(e) {
							e.preventDefault();
							w.theDate = new w._date();
							w.theDate = new w._date(w.theDate.getFullYear(), w.theDate.getMonth(), w.theDate.getDate(),0,0,0,0);
							w.d.input.trigger('datebox',{'method':'doset'});
						});
				}
				if ( o.useTomorrowButton ) {
					$('<a href="#">'+w.__('calTomorrowButtonLabel')+'</a>')
						.appendTo(hRow).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEvent, function(e) {
							e.preventDefault();
							w.theDate = new w._date();
							w.theDate = new w._date(w.theDate.getTime() + 24 * 60 * 60 * 1000); //tomorrow
							w.theDate = new w._date(w.theDate.getFullYear(), w.theDate.getMonth(), w.theDate.getDate(),0,0,0,0);
							w.d.input.trigger('datebox',{'method':'doset'});
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(hRow).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					hRow.addClass('ui-datebox-collapse');
				}
				hRow.appendTo(temp);
			}
			
			w.d.intHTML.on(o.clickEventAlt+' vmouseover vmouseout', 'div.'+uid+'griddate', function(e) {
				if ( e.type === o.clickEventAlt ) {
					e.preventDefault();
					if ( $(this).jqmData('enabled') ) {
						w.theDate.setD(2,1).setD(1,$(this).jqmData('month')).setD(2,$(this).jqmData('date'));
						w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
						w.d.input.trigger('datebox', {'method':'close'});
					}
				} else {
					if ( $(this).jqmData('enabled') && typeof $(this).jqmData('theme') !== 'undefined' && o.mobVer < 140 ) {
						if ( o.calWeekMode !== false && o.calWeekHigh === true ) {
							$(this).parent().find('div').each(function() { w._hoover(this); });
						} else { w._hoover(this); }
					}
				}
			});
			w.d.intHTML
				.on('swipeleft', function() { if ( w.calNext ) { w._offset('m', 1); } })
				.on('swiperight', function() { if ( w.calPrev ) { w._offset('m', -1); } });
			
			if ( w.wheelExists) { // Mousewheel operations, if plugin is loaded
				w.d.intHTML.on('mousewheel', function(e,d) {
					e.preventDefault();
					if ( d > 0 && w.calNext ) { 
						w.theDate.setD(2,1);
						w._offset('m', 1);
					}
					if ( d < 0 && w.calPrev ) {
						w.theDate.setD(2,1);
						w._offset('m', -1);
					}
				});
			}
		}
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeButton: 'a',
		themeInput: 'a',
		useSetButton: true,
		validHours: false,
		repButton: true
		
	});
	$.extend( $.mobile.datebox.prototype, {
		_dbox_run: function() {
			var w = this;
			w.drag.didRun = true;
			w._offset(w.drag.target[0], w.drag.target[1], false);
			w._dbox_run_update();
			w.runButton = setTimeout(function() {w._dbox_run();}, 150);
		},
		_dbox_run_update: function() {
			var w = this,
				o = this.options;
				
			w._check();
			
			if ( o.mode === 'datebox' ) {
				w.d.intHTML.find('.ui-datebox-header').find('h4').text(w._formatter(w.__('headerFormat'), w.theDate));
			}
			
			if ( o.useSetButton ) {
				if ( w.dateOK === false ) { setBut.addClass('ui-disabled'); }
				else { setBut.removeClass('ui-disabled'); }
			}
			
			w.d.divIn.find('input').each(function () {
				switch ( $(this).jqmData('field') ) {
					case 'y':
						$(this).val(w.theDate.getFullYear()); break;
					case 'm':
						$(this).val(w.theDate.getMonth() + 1); break;
					case 'd':
						$(this).val(w.theDate.getDate()); break;
					case 'h':
						if ( w.__('timeFormat') === 12 ) {
							if ( w.theDate.getHours() > 12 ) {
								$(this).val(w.theDate.getHours()-12); break;
							} else if ( w.theDate.getHours() === 0 ) {
								$(this).val(12); break;
							}
						}		
						$(this).val(w.theDate.getHours()); break;
					case 'i':
						$(this).val(w._zPad(w.theDate.getMinutes())); break;
					case 'M':
						$(this).val(w.__('monthsOfYearShort')[w.theDate.getMonth()]); break;
					case 'a':
						$(this).val((w.theDate.getHours() > 11)?w.__('meridiem')[1]:w.__('meridiem')[0]);
						break;
				}
			});
		},
		_dbox_vhour: function (delta) {
			var w = this,
				o = this.options, tmp, 
				closeya = [25,0],
				closenay = [25,0];
				
			if ( o.validHours === false ) { return true; }
			if ( $.inArray(w.theDate.getHours(), o.validHours) > -1 ) { return true; }
			
			tmp = w.theDate.getHours();
			$.each(o.validHours, function(){
				if ( ((tmp < this)?1:-1) === delta ) {
					if ( closeya[0] > Math.abs(this-tmp) ) {
						closeya = [Math.abs(this-tmp),parseInt(this,10)];
					}
				} else {
					if ( closenay[0] > Math.abs(this-tmp) ) {
						closenay = [Math.abs(this-tmp),parseInt(this,10)];
					}
				}
			});
			if ( closeya[1] !== 0 ) { w.theDate.setHours(closeya[1]); }
			else { w.theDate.setHours(closenay[1]); }
		},
		_dbox_enter: function (item) {
			var w = this;
			
			if ( item.jqmData('field') === 'M' && $.inArray(item.val(), w.__('monthsOfYearShort')) > -1 ) {
				w.theDate.setMonth($.inArray(item.val(), w.__('monthsOfYearShort')));
			}
			
			if ( item.val() !== '' && item.val().toString().search(/^[0-9]+$/) === 0 ) {
				switch ( item.jqmData('field') ) {
					case 'y':
						w.theDate.setFullYear(parseInt(item.val(),10)); break;
					case 'm':
						w.theDate.setMonth(parseInt(item.val(),10)-1); break;
					case 'd':
						w.theDate.setDate(parseInt(item.val(),10)); break;
					case 'h':
						w.theDate.setHours(parseInt(item.val(),10)); break;
					case 'i':
						w.theDate.setMinutes(parseInt(item.val(),10)); break;
				}
			}
			w.refresh();
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'timebox': function () {
			this._build.datebox.apply(this,[]);
		},
		'datebox': function () {
			var w = this,
				g = this.drag,
				o = this.options, i, y, tmp, cnt = -2,
				uid = 'ui-datebox-',
				divBase = $("<div>"),
				divPlus = $('<fieldset>'),
				divIn = divBase.clone(),
				divMinus = divPlus.clone(),
				inBase = $("<input type='"+w.inputType+"' />").addClass('ui-input-text ui-corner-all ui-shadow-inset ui-body-'+o.themeInput),
				inBaseT = $("<input type='text' />").addClass('ui-input-text ui-corner-all ui-shadow-inset ui-body-'+o.themeInput),
				butBase = $("<div></div>"),
				butPTheme = {theme: o.themeButton, icon: 'plus', iconpos: 'bottom', corners:true, shadow:true, inline:true},
				butMTheme = $.extend({}, butPTheme, {icon: 'minus', iconpos: 'top'});
			
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty().remove();
			}
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():((o.mode==='datebox')?w.__('titleDateDialogLabel'):w.__('titleTimeDialogLabel')));
			w.d.intHTML = $('<span>');

			if ( w.inputType !== 'number' ) { inBase.attr('pattern', '[0-9]*'); }
			
			w.fldOrder = ((o.mode==='datebox')?w.__('dateFieldOrder'):w.__('timeFieldOrder'));
			w._check();
			w._minStepFix();
			w._dbox_vhour(typeof w._dbox_delta !== 'undefined'?w._dbox_delta:1);
			
			if ( o.mode === 'datebox' ) { $('<div class="'+uid+'header"><h4>'+w._formatter(w.__('headerFormat'), w.theDate)+'</h4></div>').appendTo(w.d.intHTML); }
			
			for(i=0; i<=w.fldOrder.length; i++) {
				tmp = ['a','b','c','d','e','f'][i];
				switch (w.fldOrder[i]) {
					case 'y':
					case 'm':
					case 'd':
					case 'h':
						$('<div>').append(w._makeEl(inBase, {'attr': {'field':w.fldOrder[i], 'amount':1}})).addClass('ui-block-'+tmp).appendTo(divIn);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butPTheme).appendTo(divPlus);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butMTheme).appendTo(divMinus);
						cnt++;
						break;
					case 'a':
						if ( w.__('timeFormat') === 12 ) {
							$('<div>').append(w._makeEl(inBaseT, {'attr': {'field':w.fldOrder[i], 'amount':1}})).addClass('ui-block-'+tmp).appendTo(divIn);
							w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butPTheme).appendTo(divPlus);
							w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butMTheme).appendTo(divMinus);
							cnt++;
						} 
						break;
					case 'M':
						$('<div>').append(w._makeEl(inBaseT, {'attr': {'field':w.fldOrder[i], 'amount':1}})).addClass('ui-block-'+tmp).appendTo(divIn);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butPTheme).appendTo(divPlus);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':1}}).addClass('ui-block-'+tmp).buttonMarkup(butMTheme).appendTo(divMinus);
						cnt++;
						break;
					case 'i':
						$('<div>').append(w._makeEl(inBase, {'attr': {'field':w.fldOrder[i], 'amount':o.minuteStep}})).addClass('ui-block-'+tmp).appendTo(divIn);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':o.minuteStep}}).addClass('ui-block-'+tmp).buttonMarkup(butPTheme).appendTo(divPlus);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i], 'amount':o.minuteStep}}).addClass('ui-block-'+tmp).buttonMarkup(butMTheme).appendTo(divMinus);
						cnt++;
						break;
				}
			}
			
			divPlus.addClass('ui-grid-'+['a','b','c','d','e'][cnt]).appendTo(w.d.intHTML);
			divIn.addClass('ui-datebox-dboxin').addClass('ui-grid-'+['a','b','c','d','e'][cnt]).appendTo(w.d.intHTML);
			divMinus.addClass('ui-grid-'+['a','b','c','d','e'][cnt]).appendTo(w.d.intHTML);

			if ( o.mobVer >= 140 ) {
				divMinus.find('div').css({'min-height':'2.3em'});
				divPlus.find('div').css({'min-height':'2.3em'});
			}
			
			divIn.find('input').each(function () {
				switch ( $(this).jqmData('field') ) {
					case 'y':
						$(this).val(w.theDate.getFullYear()); break;
					case 'm':
						$(this).val(w.theDate.getMonth() + 1); break;
					case 'd':
						$(this).val(w.theDate.getDate()); break;
					case 'h':
						if ( w.__('timeFormat') === 12 ) {
							if ( w.theDate.getHours() > 12 ) {
								$(this).val(w.theDate.getHours()-12); break;
							} else if ( w.theDate.getHours() === 0 ) {
								$(this).val(12); break;
							}
						}		
						$(this).val(w.theDate.getHours()); break;
					case 'i':
						$(this).val(w._zPad(w.theDate.getMinutes())); break;
					case 'M':
						$(this).val(w.__('monthsOfYearShort')[w.theDate.getMonth()]); break;
					case 'a':
						$(this).val((w.theDate.getHours() > 11)?w.__('meridiem')[1]:w.__('meridiem')[0]);
						break;
				}
			});

			w.d.divIn = divIn;
			
			if ( w.dateOK !== true ) {
				divIn.find('input').addClass(uid+'griddate-disable');
			} else {
				divIn.find('.'+uid+'griddate-disable').removeClass(uid+'griddate-disable');
			}
			
			if ( o.useSetButton || o.useClearButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					setBut = $('<a href="#">'+((o.mode==='datebox')?w.__('setDateButtonLabel'):w.__('setTimeButtonLabel'))+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							if ( w.dateOK === true ) {
								w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
								w.d.input.trigger('datebox', {'method':'close'});
							}
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					y.addClass('ui-datebox-collapse');
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( o.repButton === false ) {
				divPlus.on(o.clickEvent, 'div', function(e) {
					divIn.find(':focus').blur();
					e.preventDefault();
					w._dbox_delta = 1;
					w._offset($(this).jqmData('field'), $(this).jqmData('amount'));
				});
				divMinus.on(o.clickEvent, 'div', function(e) {
					divIn.find(':focus').blur();
					e.preventDefault();
					w._dbox_delta = -1;
					w._offset($(this).jqmData('field'), $(this).jqmData('amount')*-1);
				});
			}
			
			divIn.on('change', 'input', function() { w._dbox_enter($(this)); });
					
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				divIn.on('mousewheel', 'input', function(e,d) {
					e.preventDefault();
					w._dbox_delta = d<0?-1:1;
					w._offset($(this).jqmData('field'), ((d<0)?-1:1)*$(this).jqmData('amount'));
				});
			}
			
			if ( o.repButton === true ) {
				divPlus.on(w.drag.eStart, 'div', function(e) {
					divIn.find(':focus').blur();
					tmp = [$(this).jqmData('field'), $(this).jqmData('amount')];
					w.drag.move = true;
					w._dbox_delta = 1;
					w._offset(tmp[0], tmp[1], false);
					w._dbox_run_update();
					if ( !w.runButton ) {
						w.drag.target = tmp;
						w.runButton = setTimeout(function() {w._dbox_run();}, 500);
					}
				});
				
				divMinus.on(w.drag.eStart, 'div', function(e) {
					divIn.find(':focus').blur();
					tmp = [$(this).jqmData('field'), $(this).jqmData('amount')*-1];
					w.drag.move = true;
					w._dbox_delta = -1;
					w._offset(tmp[0], tmp[1], false);
					w._dbox_run_update();
					if ( !w.runButton ) {
						w.drag.target = tmp;
						w.runButton = setTimeout(function() {w._dbox_run();}, 500);
					}
				});

				divPlus.on(g.eEndA, function(e) {
					if ( g.move ) {
						e.preventDefault();
						clearTimeout(w.runButton);
						w.runButton = false;
						g.move = false;
					}
				});
				divMinus.on(g.eEndA, function(e) {
					if ( g.move ) {
						e.preventDefault();
						clearTimeout(w.runButton);
						w.runButton = false;
						g.move = false;
					}
				});
			}
		}
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
/* FLIPBOX Mode */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeDateHigh: 'b',
		themeDatePick: 'b',
		themeDate: 'a',
		useSetButton: true,
		validHours: false,
		flen: {'y': 15, 'm':12, 'd':15, 'h':12, 'i':15, 'a':3}
	});
	$.extend( $.mobile.datebox.prototype, {
		'_fbox_pos': function () {
			var w = this,
				ech = null,
				top = null,
				par = this.d.intHTML.find('.ui-datebox-flipcontent').innerHeight(),
				tot = null;
				
			w.d.intHTML.find('.ui-datebox-flipcenter').each(function() {
				ech = $(this);
				top = ech.innerHeight();
				ech.css('top', ((par/2)-(top/2)-3)*-1);
			});
			w.d.intHTML.find('ul').each(function () {
				ech = $(this);
				par = ech.parent().innerHeight();
				top = ech.find('li').first();
				tot = ech.find('li').size() * top.outerHeight();
				top.css('marginTop', ((tot/2)-(par/2)+(top.outerHeight()/2))*-1);
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'timeflipbox': function() {
			this._build.flipbox.apply(this);
		},
		'flipbox': function () {
			var w = this,
				o = this.options, i, y, hRow, tmp, testDate,
				iDate = (w.d.input.val() === "") ? w._startOffset(w._makeDate(w.d.input.val())) : w._makeDate(w.d.input.val()),
				uid = 'ui-datebox-',
				flipBase = $("<div class='ui-overlay-shadow'><ul></ul></div>"),
				ctrl = $("<div>", {"class":uid+'flipcontent'});
			
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty();
			}
			
			w.d.input.on('datebox', function (e,p) {
				if ( p.method === 'postrefresh' ) {
					w._fbox_pos();
				}
			});
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():((o.mode==='flipbox')?w.__('titleDateDialogLabel'):w.__('titleTimeDialogLabel')));
			w.d.intHTML = $('<span>')
			
			w.fldOrder = ((o.mode==='flipbox')?w.__('dateFieldOrder'):w.__('timeFieldOrder'));
			w._check();
			w._minStepFix();
			
			if ( o.mode === 'flipbox' ) { $('<div class="'+uid+'header"><h4>'+w._formatter(w.__('headerFormat'), w.theDate)+'</h4></div>').appendTo(w.d.intHTML); }
			
			w.d.intHTML.append(ctrl);
			
			for ( y=0; y<w.fldOrder.length; y++ ) {
				switch (w.fldOrder[y]) {
					case 'y':
						hRow = w._makeEl(flipBase, {'attr': {'field':'y','amount':1} });
						for ( i=o.flen.y*-1; i<(o.flen.y+1); i++ ) {
							tmp = (i!==0)?((iDate.get(0) === (w.theDate.get(0) + i))?o.themeDateHigh:o.themeDate):o.themeDatePick;
							$('<li>', {'class':'ui-body-'+tmp})
								.html('<span>'+(w.theDate.get(0)+i)+'</span>').appendTo(hRow.find('ul'));
						}
						hRow.appendTo(ctrl);
						break;
					case 'm':
						hRow = w._makeEl(flipBase, {'attr': {'field':'m','amount':1} });
						for ( i=o.flen.m*-1; i<(o.flen.m+1); i++ ) {
							testDate = w.theDate.copy([0],[0,0,1]);
							testDate.adj(1,i);
							tmp = (i!==0)?((iDate.get(1) === testDate.get(1) && iDate.get(0) === testDate.get(0))?o.themeDateHigh:o.themeDate):o.themeDatePick;
							$("<li>", { 'class' : 'ui-body-'+tmp})
								.html("<span>"+w.__('monthsOfYearShort')[testDate.getMonth()]+"</span>").appendTo(hRow.find('ul'));
						}
						hRow.appendTo(ctrl);
						break;
					case 'd':
						hRow = w._makeEl(flipBase, {'attr': {'field':'d','amount':1} });
						for ( i=o.flen.d*-1; i<(o.flen.d+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(2,i);
							tmp = (i!==0)?((iDate.comp() === testDate.comp())?o.themeDateHigh:o.themeDate):o.themeDatePick;
							if ( ( o.blackDates !== false && $.inArray(testDate.iso(), o.blackDates) > -1 ) ||
								( o.blackDays !== false && $.inArray(testDate.getDay(), o.blackDays) > -1 ) ) {
								tmp += ' '+uid+'griddate-disable';
							}
							$("<li>", { 'class' : 'ui-body-'+tmp})
								.html("<span>"+testDate.getDate()+"</span>").appendTo(hRow.find('ul'));
						}
						hRow.appendTo(ctrl);
						break;
					case 'h':
						hRow = w._makeEl(flipBase, {'attr': {'field':'h','amount':1} });
						for ( i=o.flen.h*-1; i<(o.flen.h+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(3,i);
							tmp = (i!==0)?o.themeDate:o.themeDatePick;
							if ( o.validHours !== false && $.inArray(testDate.get(3), o.validHours) < 0 ) {
								tmp += ' '+uid+'griddate-disable';
							}
							$("<li>", { 'class' : 'ui-body-'+tmp})
								.html("<span>"+((w.__('timeFormat')===12) ? (( testDate.get(3) === 0 ) ? '12' : (( testDate.get(3) < 13 ) ? testDate.get(3) : (testDate.get(3)-12))) : testDate.get(3))+"</span>").appendTo(hRow.find('ul'));
						}
						hRow.appendTo(ctrl);
						break;
					case 'i':
						hRow = w._makeEl(flipBase, {'attr': {'field':'i','amount':o.minuteStep} });
						for ( i=o.flen.i*-1; i<(o.flen.i+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(4,(i*o.minuteStep));
							tmp = (i!==0)?o.themeDate:o.themeDatePick;
							$("<li>", { 'class' : 'ui-body-'+tmp})
								.html("<span>"+w._zPad(testDate.get(4))+"</span>").appendTo(hRow.find('ul'));
						}
						hRow.appendTo(ctrl);
						break;
					case 'a':
						if ( w.__('timeFormat') !== 12 ) { break; }
						hRow = w._makeEl(flipBase, {'attr': {'field':'a','amount':1} });
						testDate = $("<li class='ui-body-"+o.themeDate+"'><span> </span></li>");
						
						for ( i=0; i<o.flen.a; i++ ) { testDate.clone().appendTo(hRow.find('ul')); }
						if ( w.theDate.get(3) < 12 ) { testDate.clone().appendTo(hRow.find('ul')); }
						
						tmp = (w.theDate.get(3) > 11) ? [o.themeDate,o.themeDatePick] : [o.themeDatePick,o.themeDate];
						
						$("<li>", { 'class' : 'ui-body-'+tmp[0]}).html('<span>'+w.__('meridiem')[0]+'</span>').appendTo(hRow.find('ul'));
						$("<li>", { 'class' : 'ui-body-'+tmp[1]}).html('<span>'+w.__('meridiem')[1]+'</span>').appendTo(hRow.find('ul'));
						
						if ( w.theDate.get(3) > 11 ) { testDate.clone().appendTo(hRow.find('ul')); }
						for ( i=0; i<o.flen.a; i++ ) { testDate.clone().appendTo(hRow.find('ul')); }
						
						hRow.appendTo(ctrl);
						break;
				}
			}
			
			$("<div>", {"class":uid+'flipcenter ui-overlay-shadow'}).css('pointerEvents', 'none').appendTo(w.d.intHTML);
			
			if ( o.useSetButton || o.useClearButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					$('<a href="#">'+((o.mode==='flipbox')?w.__('setDateButtonLabel'):w.__('setTimeButtonLabel'))+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							if ( w.dateOK === true ) {
								w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
								w.d.input.trigger('datebox', {'method':'close'});
							}
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					y.addClass('ui-datebox-collapse');
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				w.d.intHTML.on('mousewheel', '.ui-overlay-shadow', function(e,d) {
					e.preventDefault();
					w._offset($(this).jqmData('field'), ((d<0)?-1:1)*$(this).jqmData('amount'));
				});
			}
			
			w.d.intHTML.on(w.drag.eStart, 'ul', function(e,f) {
				if ( !w.drag.move ) {
					if ( typeof f !== "undefined" ) { e = f; }
					w.drag.move = true;
					w.drag.target = $(this).find('li').first();
					w.drag.pos = parseInt(w.drag.target.css('marginTop').replace(/px/i, ''),10);
					w.drag.start = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					w.drag.end = false;
					e.stopPropagation();
					e.preventDefault();
				}
			});
			
			w.d.intHTML.on(w.drag.eStart, '.'+uid+'flipcenter', function(e) { // Used only on old browsers and IE.
				if ( !w.drag.move ) {
					w.drag.target = w.touch ? e.originalEvent.changedTouches[0].pageX - $(e.currentTarget).offset().left : e.pageX - $(e.currentTarget).offset().left;
					w.drag.tmp = w.d.intHTML.find('.'+uid+'flipcenter').innerWidth() / (( $.inArray('a', w.fldOrder) > -1 && w.__('timeFormat') !== 12 )?w.fldOrder.length-1:w.fldOrder.length);
					$(w.d.intHTML.find('ul').get(parseInt(w.drag.target / w.drag.tmp,10))).trigger(w.drag.eStart,e);
				}
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._drag, {
		'timeflipbox': function() {
			this._drag.flipbox.apply(this);
		},
		'flipbox': function() {
			var w = this,
				o = this.options,
				g = this.drag;
			
			$(document).on(g.eMove, function(e) {
				if ( g.move && ( o.mode === 'flipbox' || o.mode === 'timeflipbox' )) {
					g.end = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					g.target.css('marginTop', (g.pos + g.end - g.start) + 'px');
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			});
			
			$(document).on(g.eEnd, function(e) {
				if ( g.move && (o.mode === 'flipbox' || o.mode === 'timeflipbox' )) {
					g.move = false;
					if ( g.end !== false ) {
						e.preventDefault();
						e.stopPropagation();
						g.tmp = g.target.parent().parent();
						w._offset(g.tmp.jqmData('field'), (parseInt((g.start - g.end) / g.target.innerHeight(),10) * g.tmp.jqmData('amount')));
					}
					g.start = false;
					g.end = false;
				}
			});
		}
	});
})( jQuery );
/* 
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
/* SLIDEBOX Mode */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeDateHigh: 'b',
		themeDatePick: 'b',
		themeDate: 'a',
		useSetButton: true,
		validHours: false,
		slen: {'y': 5, 'm':6, 'd':15, 'h':12, 'i':30}
	});
	$.extend( $.mobile.datebox.prototype, {
		'_sbox_pos': function () {
			var w = this, 
				ech, top, par, tot;
			
			w.d.intHTML.find('div.ui-datebox-sliderow-int').each(function () {
				ech = $(this);
				par = ech.parent().innerWidth();
				if ( w.__('isRTL') ) { 
					top = ech.find('div').last(); 
				} else {
					top = ech.find('div').first();
				}
				tot = ech.find('div').size() * top.outerWidth();
				top.css('marginLeft', ((tot/2)-(par/2))*-1);
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'slidebox': function () {
			var w = this,
				o = this.options, i, y, hRow, phRow, tmp, testDate,
				iDate = (w.d.input.val() === "") ? w._startOffset(w._makeDate(w.d.input.val())) : w._makeDate(w.d.input.val()),
				uid = 'ui-datebox-',
				thMod = (( this.options.mobVer < 140 ) ? 'up-' : ''),
				slideBase = $("<div class='"+uid+"sliderow-int'></div>"),
				phBase = $('<div>'),
				ctrl = $("<div>", {"class":uid+'slide'});
			
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty().remove()
			}
			
			w.d.input.on('datebox', function (e,p) {
				if ( p.method === 'postrefresh' ) { w._sbox_pos(); }
			});
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():w.__('titleDateDialogLabel'));
			w.d.intHTML = $('<span>')
			
			w.fldOrder = w.__('slideFieldOrder');
			w._check();
			w._minStepFix();
			
			$('<div class="'+uid+'header"><h4>'+w._formatter(w.__('headerFormat'), w.theDate)+'</h4></div>').appendTo(w.d.intHTML);
			
			w.d.intHTML.append(ctrl);
			
			for ( y=0; y<w.fldOrder.length; y++ ) {
				phRow = phBase.clone().jqmData('rowtype', w.fldOrder[y]);
				hRow = slideBase.clone().jqmData('rowtype', w.fldOrder[y]).appendTo(phRow);
				if ( w.__('isRTL') === true ) { hRow.css('direction', 'rtl'); }
				
				switch (w.fldOrder[y]) {
					case 'y':
						phRow.addClass(uid+'sliderow-ym');
						for ( i=o.slen.y*-1; i<(o.slen.y+1); i++ ) {
							tmp = (i!==0)?((iDate.get(0) === (w.theDate.get(0) + i))?o.themeDateHigh:o.themeDate):o.themeDatePick;
							$('<div>', {'class':uid+'slideyear ui-corner-all ui-btn ui-btn-'+thMod+tmp})
								.html(w.theDate.get(0)+i).jqmData('offset', i).jqmData('theme', tmp).appendTo(hRow);
						}
						break;
					case 'm':
						phRow.addClass(uid+'sliderow-ym');
						for ( i=o.slen.m*-1; i<(o.slen.m+1); i++ ) {
							testDate = w.theDate.copy([0],[0,0,1]);
							testDate.adj(1,i);
							tmp = (i!==0)?((iDate.get(1) === testDate.get(1) && iDate.get(0) === testDate.get(0))?o.themeDateHigh:o.themeDate):o.themeDatePick;
							$('<div>', {'class':uid+'slidemonth ui-corner-all ui-btn ui-btn-'+thMod+tmp})
								.html(String(w.__('monthsOfYearShort')[testDate.get(1)]))
								.jqmData('offset', i)
								.jqmData('theme', tmp).appendTo(hRow);
						}
						break;
						
					case 'd':
						phRow.addClass(uid+'sliderow-d');
						for ( i=o.slen.d*-1; i<(o.slen.d+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(2,i);
							tmp = (i!==0)?((iDate.comp() === testDate.comp())?o.themeDateHigh:o.themeDate):o.themeDatePick;
							if ( ( o.blackDates !== false && $.inArray(testDate.iso(), o.blackDates) > -1 ) ||
								( o.blackDays !== false && $.inArray(testDate.getDay(), o.blackDays) > -1 ) ) {
								tmp += ' '+uid+'griddate-disable';
							}
							$('<div>', {'class':uid+'slideday ui-corner-all ui-btn ui-btn-'+thMod+tmp})
								.html(testDate.get(2) + '<br /><span class="'+uid+'slidewday">' + w.__('daysOfWeekShort')[testDate.getDay()] + '</span>')
								.jqmData('offset', i).jqmData('theme', tmp).appendTo(hRow);
						}
						break;
					case 'h':
						phRow.addClass(uid+'sliderow-hi');
						for ( i=o.slen.h*-1; i<(o.slen.h+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(3,i);
							tmp = (i!==0)?o.themeDate:o.themeDatePick;
							if ( o.validHours !== false && $.inArray(testDate.get(3), o.validHours) < 0 ) {
								tmp += ' '+uid+'griddate-disable';
							}
							$('<div>', {'class':uid+'slidehour ui-corner-all ui-btn ui-btn-'+thMod+tmp})
								.html( w.__('timeFormat') === 12 ? w._formatter('%I<span class="'+uid+'slidewday">%p</span>', testDate) : testDate.get(3) )
								.jqmData('offset', i).jqmData('theme', tmp).appendTo(hRow);
						}
						break;
					case 'i':
						phRow.addClass(uid+'sliderow-hi');
						for ( i=o.slen.i*-1; i<(o.slen.i+1); i++ ) {
							testDate = w.theDate.copy();
							testDate.adj(4,(i*o.minuteStep));
							tmp = (i!==0)?o.themeDate:o.themeDatePick;
							$('<div>', {'class':uid+'slidemins ui-corner-all ui-btn ui-btn-'+thMod+tmp})
								.html(w._zPad(testDate.get(4))).jqmData('offset', i*o.minuteStep).jqmData('theme', tmp).appendTo(hRow);
						}
						break;
				}
				phRow.appendTo(ctrl);
			}
			
			if ( o.useSetButton || o.useClearButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					$('<a href="#">'+w.__('setDateButtonLabel')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							if ( w.dateOK === true ) {
								w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
								w.d.input.trigger('datebox', {'method':'close'});
							}
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					y.addClass('ui-datebox-collapse');
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				w.d.intHTML.on('mousewheel', '.ui-datebox-sliderow-int', function(e,d) {
					e.preventDefault();
					w._offset($(this).jqmData('rowtype'), ((d<0)?-1:1)*($(this).jqmData('rowtype')==='i'?o.minuteStep:1));
				});
			}
			
			w.d.intHTML.on(o.clickEvent, '.ui-datebox-sliderow-int>div', function(e) {
				e.preventDefault();
				w._offset($(this).parent().jqmData('rowtype'), parseInt($(this).jqmData('offset'),10));
			});
			w.d.intHTML.on('vmouseover vmouseout', '.ui-datebox-sliderow-int>div', function() {
				w._hoover(this);
			});
			
			w.d.intHTML.on(w.drag.eStart, '.ui-datebox-sliderow-int', function(e) {
				if ( !w.drag.move ) {
					w.drag.move = true;
					w.drag.target = $(this);
					w.drag.pos = parseInt(w.drag.target.css('marginLeft').replace(/px/i, ''),10);
					w.drag.start = w.touch ? e.originalEvent.changedTouches[0].pageX : e.pageX;
					w.drag.end = false;
					e.stopPropagation();
					e.preventDefault();
				}
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._drag, {
		'slidebox': function() {
			var w = this,
				o = this.options,
				g = this.drag;
			
			$(document).on(g.eMove, function(e) {
				if ( g.move && o.mode === 'slidebox') {
					g.end = w.touch ? e.originalEvent.changedTouches[0].pageX : e.pageX;
					g.target.css('marginLeft', (g.pos + g.end - g.start) + 'px');
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			});
			
			$(document).on(g.eEnd, function(e) {
				if ( g.move && o.mode === 'slidebox' ) {
					g.move = false;
					if ( g.end !== false ) {
						e.preventDefault();
						e.stopPropagation();
						g.tmp = g.target.find('div').first();
						w._offset(g.target.jqmData('rowtype'), ( w.__('isRTL') ? -1 : 1 )*(parseInt((g.start - g.end) / g.tmp.innerWidth(),10))*(g.target.jqmData('rowtype')==='i'?o.minuteStep:1));
					}
					g.start = false;
					g.end = false;
				}
			});
		}
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
 /* DurationBox Mode */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeButton: 'a',
		themeInput: 'a',
		useSetButton: true,
		repButton: true,
		durationSteppers: {'d': 1, 'h': 1, 'i': 1, 's': 1}
	});
	$.extend( $.mobile.datebox.prototype, {
		_durbox_run: function() {
			var w = this;
			w.drag.didRun = true;
			w._offset(w.drag.target[0], w.drag.target[1], false);
			w._durbox_run_update();
			w.runButton = setTimeout(function() {w._durbox_run();}, 100);
		},
		_durbox_run_update: function () {
			var w = this, i, cDur = [],
				ival = {'d': 60*60*24, 'h': 60*60, 'i': 60};

			i = w.theDate.getEpoch() - w.initDate.getEpoch();
			if ( i<0 ) { i = 0; w.theDate.setTime(w.initDate.getTime()); }
			w.lastDuration = i; // Let the number of seconds be sort of public.
			
			// DAYS 
			cDur[0] = parseInt( i / ival.d,10); i = i % ival.d;
			// HOURS 
			cDur[1] = parseInt( i / ival.h, 10); i = i % ival.h;
			// MINS AND SECS 
			cDur[2] = parseInt( i / ival.i, 10);
			cDur[3] = i % ival.i;

			w.d.divIn.find('input').each(function () {
				switch ( $(this).parent().jqmData('field') ) {
					case 'd':
						$(this).val(cDur[0]); break;
					case 'h':
						$(this).val(cDur[1]); break;
					case 'i':
						$(this).val(cDur[2]); break;
					case 's':
						$(this).val(cDur[3]); break;
				}
			});
		},
		_durbox_valid: function (num) {
			if ( num.toString().search(/^[0-9]+$/) === 0 ) { return parseInt(num,10); }
			return 0;
		},
		_durbox_enter: function (item) {
			var w = this,
				t = w.initDate.getEpoch();
				
			w.d.intHTML.find('input').each( function() {
				switch ( $(this).parent().jqmData('field') ) {
					case 'd':
						t += (60*60*24) * w._durbox_valid($(this).val()); break;
					case 'h':
						t += (60*60) * w._durbox_valid($(this).val()); break;
					case 'i':
						t += (60) * w._durbox_valid($(this).val()); break;
					case 's':
						t += w._durbox_valid($(this).val()); break;
				}
			});
			w.theDate.setTime( t * 1000 );
			w.refresh();
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'durationbox': function () {
			var w = this,
				g = this.drag,
				o = this.options, i, y, cDur = [0,0,0,0], tmp,
				ival = {'d': 60*60*24, 'h': 60*60, 'i': 60},
				uid = 'ui-datebox-',
				divBase = $("<div>"),
				divPlus = $('<fieldset>'),
				divIn = divBase.clone().addClass('ui-datebox-dboxin'),
				divMinus = divPlus.clone(),
				inBase = $("<input type='"+w.inputType+"' />").addClass('ui-input-text ui-corner-all ui-shadow-inset ui-body-'+o.themeInput),
				butBase = $("<div><a href='#'> </a></div>"),
				butPTheme = {theme: o.themeButton, icon: 'plus', iconpos: 'bottom', corners:true, shadow:true},
				butMTheme = $.extend({}, butPTheme, {icon: 'minus', iconpos: 'top'});
			
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty().remove();
			}
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():w.__('titleDateDialogLabel'));
			w.d.intHTML = $('<span>');
			
			if ( w.inputType !== 'number' ) { inBase.attr('pattern', '[0-9]*'); }
			
			w.fldOrder = w.__('durationOrder');
			
			for(i=0; i<=w.fldOrder.length; i++) {
				switch (w.fldOrder[i]) {
					case 'd':
					case 'h':
					case 'i':
					case 's':
						y = $.inArray(w.fldOrder[i], ['d','h','i','s']);
						$('<div>').jqmData('field', w.fldOrder[i]).addClass('ui-block-'+['a','b','c','d'][i]).append(inBase.clone()).appendTo(divIn).prepend('<label>'+w.__('durationLabel')[y]+'</label>');
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i]}}).addClass('ui-block-'+['a','b','c','d'][i]).buttonMarkup(butPTheme).appendTo(divPlus);
						w._makeEl(butBase, {'attr': {'field':w.fldOrder[i]}}).addClass('ui-block-'+['a','b','c','d'][i]).buttonMarkup(butMTheme).appendTo(divMinus);
						break;
				}
			}
			
			i = w.theDate.getEpoch() - w.initDate.getEpoch();
			if ( i<0 ) { i = 0; w.theDate.setTime(w.initDate.getTime()); }
			w.lastDuration = i; // Let the number of seconds be sort of public.
			
			// DAYS 
			cDur[0] = parseInt( i / ival.d,10); i = i % ival.d;
			// HOURS 
			cDur[1] = parseInt( i / ival.h, 10); i = i % ival.h;
			// MINS AND SECS 
			cDur[2] = parseInt( i / ival.i, 10);
			cDur[3] = i % ival.i;
			
			divIn.find('input').each(function () {
				switch ( $(this).parent().jqmData('field') ) {
					case 'd':
						$(this).val(cDur[0]); break;
					case 'h':
						$(this).val(cDur[1]); break;
					case 'i':
						$(this).val(cDur[2]); break;
					case 's':
						$(this).val(cDur[3]); break;
				}
			});

			w.d.divIn = divIn;
			
			divPlus.addClass('ui-grid-'+['a','b','c'][w.fldOrder.length-2]).appendTo(w.d.intHTML);
			divIn.addClass('ui-grid-'+['a','b','c'][w.fldOrder.length-2]).appendTo(w.d.intHTML);
			divMinus.addClass('ui-grid-'+['a','b','c'][w.fldOrder.length-2]).appendTo(w.d.intHTML);

			if (o.mobVer >= 140) {
				divMinus.find('div').css({'min-height': '2.3em'});
				divPlus.find('div').css({'min-height': '2.3em'});
			}
			
			if ( o.useSetButton || o.useClearButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					$('<a href="#">'+w.__('setDurationButtonLabel')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
							w.d.input.trigger('datebox', {'method':'close'});
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					y.addClass('ui-datebox-collapse');
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( o.repButton === false ) {
				divPlus.on(o.clickEvent, 'div', function(e) {
					divIn.find(':focus').blur();
					e.preventDefault();
					w._offset($(this).jqmData('field'), o.durationSteppers[$(this).jqmData('field')]);
				});
				divMinus.on(o.clickEvent, 'div', function(e) {
					divIn.find(':focus').blur();
					e.preventDefault();
					w._offset($(this).jqmData('field'), o.durationSteppers[$(this).jqmData('field')]*-1);
				});
			}
			
			divIn.on('change', 'input', function() { w._durbox_enter($(this)); });
					
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				divIn.on('mousewheel', 'input', function(e,d) {
					e.preventDefault();
					w._offset($(this).parent().jqmData('field'), ((d<0)?-1:1)*o.durationSteppers[$(this).parent().jqmData('field')]);
				});
			}
			
			if ( o.repButton === true ) {
				divPlus.on(w.drag.eStart, 'div', function(e) {
					divIn.find(':focus').blur();
					tmp = [$(this).jqmData('field'), o.durationSteppers[$(this).jqmData('field')]];
					w.drag.move = true;
					w._dbox_delta = 1;
					w._offset(tmp[0], tmp[1], false);
					w._durbox_run_update();
					if ( !w.runButton ) {
						w.drag.target = tmp;
						w.runButton = setTimeout(function() {w._durbox_run();}, 500);
					}
				});
				
				divMinus.on(w.drag.eStart, 'div', function(e) {
					divIn.find(':focus').blur();
					tmp = [$(this).jqmData('field'), o.durationSteppers[$(this).jqmData('field')]*-1];
					w.drag.move = true;
					w._dbox_delta = -1;
					w._offset(tmp[0], tmp[1], false);
					w._durbox_run_update();
					if ( !w.runButton ) {
						w.drag.target = tmp;
						w.runButton = setTimeout(function() {w._durbox_run();}, 500);
					}
				});
				
				divPlus.on(g.eEndA, function(e) {
					if ( g.move ) {
						e.preventDefault();
						clearTimeout(w.runButton);
						w.runButton = false;
						g.move = false;
					}
				});
				divMinus.on(g.eEndA, function(e) {
					if ( g.move ) {
						e.preventDefault();
						clearTimeout(w.runButton);
						w.runButton = false;
						g.move = false;
					}
				});
			}
		}
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
 /* DurationFlipBox Mode */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeDatePick: 'b',
		themeDate: 'a',
		useSetButton: true,
		durationSteppers: {'d': 1, 'h': 1, 'i': 1, 's': 1}
	});
	$.extend( $.mobile.datebox.prototype, {
		'_durfbox_pos': function () {
			var w = this,
				ech = null,
				top = null,
				par = this.d.intHTML.find('.ui-datebox-flipcontent').innerHeight(),
				tot = null;
				
			w.d.intHTML.find('.ui-datebox-flipcenter').each(function() {
				ech = $(this);
				top = ech.innerHeight();
				ech.css('top', ((par/2)-(top/2)+4)*-1);
			});
			w.d.intHTML.find('ul').each(function () {
				ech = $(this);
				par = ech.parent().innerHeight();
				top = ech.find('li').first();
				tot = ech.find('li').size() * top.outerHeight();
				top.css('marginTop', ((tot/2)-(par/2)+(top.outerHeight()/2))*-1);
			});
		},
		'_durfbox_series': function (middle, side, type) {
			var w = this, 
				o = this.options,
				ret = [[middle.toString(), middle]], nxt, prv;
			 
			for ( var i = 1; i <= side; i++ ) {
				nxt = middle + ( i * o.durationSteppers[type] );
				prv = middle - ( i * o.durationSteppers[type] );
				ret.unshift([nxt.toString(), nxt]);
				if ( prv > -1 ) {
					ret.push([prv.toString(), prv]);
				} else {
					ret.push(['',-1]);
				}
			}
			return ret;
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		'durationflipbox': function () {
			var w = this,
				o = this.options, i, y, tt, hRow, tmp, testDate,
				sel = ['d','h','i','s'],
				cDur = [0,0,0,0],
				cDurS = {},
				ival = {'d': 60*60*24, 'h': 60*60, 'i': 60},
				uid = 'ui-datebox-',
				flipBase = $("<div class='ui-overlay-shadow'><ul></ul></div>"),
				ctrl = $("<div>", {"class":uid+'flipcontent'+' '+uid+'flipcontentd'});
			
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty().remove();
			}
			
			w.d.input.on('datebox', function (e,p) {
				if ( p.method === 'postrefresh' ) { w._durfbox_pos(); }
			});
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():w.__('titleDateDialogLabel'));
			w.d.intHTML = $('<span>');
			
			w.fldOrder = w.__('durationOrder');
			
			tmp = $('<div class="'+uid+'header ui-grid-'+[0,0,'a','b','c'][w.fldOrder.length]+'"></div>');
			for ( y=0; y<w.fldOrder.length; y++ ) {
				$('<div class="ui-block-'+['a','b','c','d'][y]+'">'+w.__('durationLabel')[jQuery.inArray(w.fldOrder[y],['d','h','i','s'])]+'</div>').css('textAlign','center').appendTo(tmp);
			}
			tmp.appendTo(w.d.intHTML);
			
			w.d.intHTML.append(ctrl);
			
			i = w.theDate.getEpoch() - w.initDate.getEpoch();
			if ( i<0 ) { i = 0; w.theDate.setTime(w.initDate.getTime()); }
			w.lastDuration = i; // Let the number of seconds be sort of public.
			
			// SPLIT TIME INTO DAYS, HRS, MIN, SEC
			cDur[0] = parseInt( i / ival.d, 10); i = i % ival.d;
			cDur[1] = parseInt( i / ival.h, 10); i = i % ival.h;
			cDur[2] = parseInt( i / ival.i, 10);
			cDur[3] = i % ival.i;
			
			cDurS.d = w._durfbox_series(cDur[0],16,'d');
			cDurS.h = w._durfbox_series(cDur[1],16,'h');
			cDurS.i = w._durfbox_series(cDur[2],20,'i');
			cDurS.s = w._durfbox_series(cDur[3],20,'s');
			
			for ( y=0; y<w.fldOrder.length; y++ ) {
				tt = w.fldOrder[y];
				sel = cDur[jQuery.inArray(tt,['d','h','i','s'])];
				hRow = w._makeEl(flipBase, {'attr': {'field':tt,'amount':o.durationSteppers[tt]} });
				for ( i in cDurS[tt] ) {
					tmp = (cDurS[tt][i][1]!==sel)?o.themeDate:o.themeDatePick;
					$("<li>", { 'class' : 'ui-body-'+tmp})
						.html("<span>"+cDurS[tt][i][0] +"</span>").appendTo(hRow.find('ul'));
				}
				hRow.appendTo(ctrl);
			}
			
			$("<div>", {"class":uid+'flipcenter ui-overlay-shadow'}).css('pointerEvents', 'none').appendTo(w.d.intHTML);
			
			if ( o.useSetButton || o.useClearButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					$('<a href="#">'+w.__('setDurationButtonLabel')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(w.__fmt(),w.theDate), 'date':w.theDate});
							w.d.input.trigger('datebox', {'method':'close'});
						});
				}
				if ( o.useClearButton ) {
					$('<a href="#">'+w.__('clearButton')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'delete', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.val('');
							w.d.input.trigger('datebox',{'method':'clear'});
							w.d.input.trigger('datebox',{'method':'close'});
						});
				}
				if ( o.useCollapsedBut ) {
					y.addClass('ui-datebox-collapse');
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				w.d.intHTML.on('mousewheel', '.ui-overlay-shadow', function(e,d) {
					e.preventDefault();
					w._offset($(this).jqmData('field'), ((d<0)?-1:1)*$(this).jqmData('amount'));
				});
			}
			
			w.d.intHTML.on(w.drag.eStart, 'ul', function(e,f) {
				if ( !w.drag.move ) {
					if ( typeof f !== "undefined" ) { e = f; }
					w.drag.move = true;
					w.drag.target = $(this).find('li').first();
					w.drag.pos = parseInt(w.drag.target.css('marginTop').replace(/px/i, ''),10);
					w.drag.start = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					w.drag.end = false;
					e.stopPropagation();
					e.preventDefault();
				}
			});
			
			w.d.intHTML.on(w.drag.eStart, '.'+uid+'flipcenter', function(e) { // Used only on old browsers and IE.
				if ( !w.drag.move ) {
					w.drag.target = w.touch ? e.originalEvent.changedTouches[0].pageX - $(e.currentTarget).offset().left : e.pageX - $(e.currentTarget).offset().left;
					w.drag.tmp = w.d.intHTML.find('.'+uid+'flipcenter').innerWidth() / (( $.inArray('a', w.fldOrder) > -1 && w.__('timeFormat') !== 12 )?w.fldOrder.length-1:w.fldOrder.length);
					$(w.d.intHTML.find('ul').get(parseInt(w.drag.target / w.drag.tmp,10))).trigger(w.drag.eStart,e);
				}
			});
			
		}
	});
	$.extend( $.mobile.datebox.prototype._drag, {
		'durationflipbox': function() {
			var w = this,
				o = this.options,
				g = this.drag;
			
			$(document).on(g.eMove, function(e) {
				if ( g.move && o.mode === 'durationflipbox' ) {
					g.end = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					g.target.css('marginTop', (g.pos + g.end - g.start) + 'px');
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			});
			
			$(document).on(g.eEnd, function(e) {
				if ( g.move && o.mode === 'durationflipbox' ) {
					g.move = false;
					if ( g.end !== false ) {
						e.preventDefault();
						e.stopPropagation();
						g.tmp = g.target.parent().parent();
						w._offset(g.tmp.jqmData('field'), (parseInt((g.start - g.end) / g.target.innerHeight(),10) * g.tmp.jqmData('amount') *-1 ));
					}
					g.start = false;
					g.end = false;
				}
			});
		}
	});
})( jQuery );
/*
 * jQuery Mobile Framework : plugin to provide a date and time picker.
 * Copyright (c) JTSage
 * CC 3.0 Attribution.  May be relicensed without permission/notification.
 * https://github.com/jtsage/jquery-mobile-datebox
 */
/* CUSTOMFLIP Mode */

(function($) {
	$.extend( $.mobile.datebox.prototype.options, {
		themeOptPick: 'b',
		themeOpt: 'a',
		useSetButton: true,
		customData: [
			{'input': true, 'name':'Letter', 'data':['a','b','c','d','e']},
			{'input': true, 'name':'Text', 'data':['some','bull','shtuff','here']},
			{'input': false, 'name':'Image', 'data':['<img src="img/slot1.png" />','<img src="img/slot2.png" />','<img src="img/slot3.png" />','<img src="img/slot4.png" />']}
		],
		customDefault: [0,0,0],
		customFormat: false,
		customfliplang: {
			// This structure interfaces with __() -> if it exists, strings are looked up here after i8n fails,
			// and before going to 'default' - the name syntax is <mode>lang
			'customSet':'Looks Good'
		}
	});
	$.extend( $.mobile.datebox.prototype, {
		'_customflipDoSet': function () {
			// If this function exists, it overrides the 'doset' method of the 'datebox' event.
			// The name syntax is _<mode>DoSet
			var w = this, o = this.options;
			if ( typeof w.customCurrent === 'undefined' ) { w.customCurrent = this._makeDate(this.d.input.val()); }
			w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(o.customFormat,w.customCurrent), 'date':w.customCurrent});
		},
		'_cubox_offset': function (fld, amount) {
			// This is *not* an automatic override, used below specificly.
			var w = this, x,
				o = this.options;
				
			tmp = (w.customCurrent[fld] + amount) % o.customData[fld]['data'].length;
			if ( tmp < 0 ) { tmp = o.customData[fld]['data'].length + tmp; }
			
			w.customCurrent[fld] = tmp;
			if ( o.useImmediate ) { w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(o.customFormat,w.customCurrent), 'date':w.customCurrent}); }
			w.refresh();
		},
		'_cubox_arr': function (data, choice) {
			var base = data, x,
				before = data.slice(0,choice),
				after = data.slice(choice+1);
			
			while ( before.length < 10 ) {
				for ( x = base.length; x > 0; x-- ) {
					before.unshift(base[x-1]);
				}
			}
			while ( before.length > 10 ) {
				before.shift();
			}
			
			while ( after.length < 10 ) {
				for ( x = 0; x < base.length; x++ ) {
					after.push(base[x]);
				}
			}
			after.length = 10;
			
			before.push(data[choice]);
			
			return $.merge($.merge([], before), after);
		},
		'_cubox_pos': function () {
			var w = this,
				ech = null,
				top = null,
				par = this.d.intHTML.find('.ui-datebox-flipcontent').innerHeight(),
				tot = null;
				
			w.d.intHTML.find('.ui-datebox-flipcenter').each(function() {
				ech = $(this);
				top = ech.innerHeight();
				ech.css('top', ((par/2)-(top/2)+4)*-1);
			});
			w.d.intHTML.find('ul').each(function () {
				ech = $(this);
				par = ech.parent().innerHeight();
				top = ech.find('li').first();
				tot = ech.find('li').size() * top.outerHeight();
				top.css('marginTop', ((tot/2)-(par/2)+(top.outerHeight()/2))*-1);
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._parser, {
		// If this stucture exists, it is called instead of the usual date input parser.
		// The name of the structure is the same as the mode name - it recieves a string
		// as the input, which is the current value of the input element, pre-sanitized
		'customflip' : function ( str ) { 
			var w = this,
				o = this.options,
				adv = o.customFormat,
				exp_input, exp_format, tmp, tmp2, retty_val=[0,0,0,0,0,0];

			if ( typeof(adv) !== 'string' ) { adv = ''; }

			adv = adv.replace(/%X([0-9a-f])/gi, function(match, oper) {
	          	switch (oper) {
    		    	case 'a':
					case 'b':
					case 'c':
					case 'd':
					case 'e':
					case 'f':
						return '(' + match + '|' + '.+?' + ')'; break;
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
						return '(' + match + '|' + '[0-9]+' + ')'; break;
          			default:
						return '.+?';
          		}
        	});

			adv = new RegExp('^' + adv + '$');
			exp_input = adv.exec(str);
			exp_format = adv.exec(o.customFormat);

			if ( exp_input !== null ) {
				for ( var x = 1; x<exp_input.length; x++ ) {
					tmp = exp_format[x].charAt(2);
					console.log(tmp);
					if ( isNaN(parseInt(tmp)) ) {
						tmp2 = $.inArray(tmp, ['a','b','c','d','e','f']);
						retty_val[tmp2] = $.inArray(exp_input[x], o.customData[tmp2].data);
					} else {
						retty_val[parseInt(tmp)-1] = parseInt(exp_input[x]);
					}
				}
			}

			//outputty = { 'in': exp_input, 'fmt': o.customFormat, 'str': str, 'format': exp_format, 'retty': retty_val };
			return ( str.length < 1 || retty_val.length < 1 ) ? this.options.customDefault : retty_val;

		}
	});
	$.extend( $.mobile.datebox.prototype._customformat, {
		// If this stucture exists, the formatter will call it when it encounters a special string
		// %X<whatever> - it recieves the single letter operater, and the current "date" value
		'customflip' : function ( oper, val, o ) {
			var per = parseInt(oper), tmp;

			if ( typeof(per) === 'number' && !isNaN(per) ) {
				return val[oper-1];
			} else {
				tmp = $.inArray(oper, ['a','b','c','d','e','f']);
				return o.customData[tmp].data[val[tmp]];
			}
		}
	});
	$.extend( $.mobile.datebox.prototype._build, {
		// This builds the actual interface, and is called on *every* refresh. (after each "movement")
		'customflip': function () {
			var w = this,
				o = this.options, i, y, hRow, tmp, lineArr,
				uid = 'ui-datebox-',
				customCurrent = this._makeDate(this.d.input.val()),
				flipBase = $("<div class='ui-overlay-shadow'><ul></ul></div>"),
				ctrl = $("<div>", {"class":uid+'flipcontent'});
			
			if ( typeof w.customCurrent === "undefined" ) { w.customCurrent = customCurrent; }
			
			if ( o.customFormat === false ) {
				tmp = [];
				for ( i = 0; i<o.customData.length; i++ ) {
					tmp.push('%X'+(i+1));
				} 
				o.customFormat = tmp.join(',');
			}
				
			if ( typeof w.d.intHTML !== 'boolean' ) {
				w.d.intHTML.empty().remove();
			}
			
			w.d.input.on('datebox', function (e,p) {
				if ( p.method === 'postrefresh' ) {
					w._cubox_pos();
				}
			});
			
			w.d.headerText = ((w._grabLabel() !== false)?w._grabLabel():w.__('tireTitleString'));
			w.d.intHTML = $('<span>');
			
			w.fldOrder = o.tireFieldOrder;
			
			tmp = $('<div class="'+uid+'header ui-grid-'+[0,0,'a','b','c'][o.customData.length]+'"></div>');
			for ( y=0; y<o.customData.length; y++ ) {
				$('<div class="ui-block-'+['a','b','c','d'][y]+'">'+o.customData[y]['name']+'</div>').css('textAlign','center').appendTo(tmp);
			}
			tmp.appendTo(w.d.intHTML);
			
			w.d.intHTML.append(ctrl);
			
			for ( y=0; y<o.customData.length; y++ ) {
				lineArr = w._cubox_arr(o.customData[y]['data'], w.customCurrent[y]);
				hRow = w._makeEl(flipBase, {'attr': {'field':y,'amount':1} });
				for ( i in lineArr ) {
					tmp = (i!=10)?o.themeOpt:o.themeOptPick;
					$('<li>', {'class':'ui-body-'+tmp})
						.html('<span>'+lineArr[i]+'</span>').appendTo(hRow.find('ul'));
					} 
					hRow.appendTo(ctrl);
			}
			
			$("<div>", {"class":uid+'flipcenter ui-overlay-shadow'}).css('pointerEvents', 'none').appendTo(w.d.intHTML);
			
			if ( o.useSetButton ) {
				y = $('<div>', {'class':uid+'controls'});
				
				if ( o.useSetButton ) {
					$('<a href="#">'+w.__('customSet')+'</a>')
						.appendTo(y).buttonMarkup({theme: o.theme, icon: 'check', iconpos: 'left', corners:true, shadow:true})
						.on(o.clickEventAlt, function(e) {
							e.preventDefault();
							w.d.input.trigger('datebox', {'method':'set', 'value':w._formatter(o.customFormat,w.customCurrent), 'date':w.tireChoice});
							w.d.input.trigger('datebox', {'method':'close'});
						});
				}
				y.appendTo(w.d.intHTML);
			}
			
			if ( w.wheelExists ) { // Mousewheel operation, if plugin is loaded
				w.d.intHTML.on('mousewheel', '.ui-overlay-shadow', function(e,d) {
					e.preventDefault();
					w._cubox_offset($(this).jqmData('field'), ((d<0)?1:-1)*$(this).jqmData('amount'));
				});
			}
			
			w.d.intHTML.on(w.drag.eStart, 'ul', function(e,f) {
				if ( !w.drag.move ) {
					if ( typeof f !== "undefined" ) { e = f; }
					w.drag.move = true;
					w.drag.target = $(this).find('li').first();
					w.drag.pos = parseInt(w.drag.target.css('marginTop').replace(/px/i, ''),10);
					w.drag.start = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					w.drag.end = false;
					e.stopPropagation();
					e.preventDefault();
				}
			});
			
			w.d.intHTML.on(w.drag.eStart, '.'+uid+'flipcenter', function(e) { // Used only on old browsers and IE.
				if ( !w.drag.move ) {
					w.drag.target = w.touch ? e.originalEvent.changedTouches[0].pageX - $(e.currentTarget).offset().left : e.pageX - $(e.currentTarget).offset().left;
					w.drag.tmp = w.d.intHTML.find('.'+uid+'flipcenter').innerWidth() / (( $.inArray('a', w.fldOrder) > -1 && w.__('timeFormat') !== 12 )?w.fldOrder.length-1:w.fldOrder.length);
					$(w.d.intHTML.find('ul').get(parseInt(w.drag.target / w.drag.tmp,10))).trigger(w.drag.eStart,e);
				}
			});
		}
	});
	$.extend( $.mobile.datebox.prototype._drag, {
		// This contains the code that the drag and drop (or touch move) code uses
		'customflip': function() {
			var w = this,
				o = this.options,
				g = this.drag;
			
			$(document).on(g.eMove, function(e) {
				if ( g.move && o.mode === 'customflip' ) {
					g.end = w.touch ? e.originalEvent.changedTouches[0].pageY : e.pageY;
					g.target.css('marginTop', (g.pos + g.end - g.start) + 'px');
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
			});
			
			$(document).on(g.eEnd, function(e) {
				if ( g.move && o.mode === 'customflip' ) {
					g.move = false;
					if ( g.end !== false ) {
						e.preventDefault();
						e.stopPropagation();
						g.tmp = g.target.parent().parent();
						w._cubox_offset(g.tmp.jqmData('field'), (parseInt((g.start - g.end) / g.target.innerHeight(),10) * g.tmp.jqmData('amount')));
					}
					g.start = false;
					g.end = false;
				}
			});
		}
	});
})( jQuery );
/*
 * jQuery-Mobile-DateBox 
 * Date: Wed Nov 19 2014 21:05:33 UTC
 * http://dev.jtsage.com/jQM-DateBox/
 * https://github.com/jtsage/jquery-mobile-datebox
 *
 * Copyright 2010, 2014 JTSage. and other contributors
 * Released under the MIT license.
 * https://github.com/jtsage/jquery-mobile-datebox/blob/master/LICENSE.txt
 *
 */
jQuery.extend(jQuery.mobile.datebox.prototype.options.lang, { "en": {
	"setDateButtonLabel": "Set Date",
	"setTimeButtonLabel": "Set Time",
	"setDurationButtonLabel": "Set Duration",
	"calTodayButtonLabel": "Jump to Today",
	"titleDateDialogLabel": "Choose Date",
	"titleTimeDialogLabel": "Choose Time",
	"daysOfWeek": [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	],
	"daysOfWeekShort": [
		"Su",
		"Mo",
		"Tu",
		"We",
		"Th",
		"Fr",
		"Sa"
	],
	"monthsOfYear": [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	],
	"monthsOfYearShort": [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	],
	"durationLabel": [
		"Days",
		"Hours",
		"Minutes",
		"Seconds"
	],
	"durationDays": [
		"Day",
		"Days"
	],
	"tooltip": "Open Date Picker",
	"nextMonth": "Next Month",
	"prevMonth": "Previous Month",
	"timeFormat": 12,
	"headerFormat": "%A, %B %-d, %Y",
	"dateFieldOrder": [
		"m",
		"d",
		"y"
	],
	"timeFieldOrder": [
		"h",
		"i",
		"a"
	],
	"slideFieldOrder": [
		"y",
		"m",
		"d"
	],
	"dateFormat": "%-m/%-d/%Y",
	"useArabicIndic": false,
	"isRTL": false,
	"calStartDay": 0,
	"clearButton": "Clear",
	"durationOrder": [
		"d",
		"h",
		"i",
		"s"
	],
	"meridiem": [
		"AM",
		"PM"
	],
	"timeOutput": "%l:%M %p",
	"durationFormat": "%Dd %DA, %Dl:%DM:%DS",
	"calDateListLabel": "Other Dates",
	"calHeaderFormat": "%B %Y",
	"calTomorrowButtonLabel": "Jump to Tomorrow"
}});
jQuery.extend(jQuery.mobile.datebox.prototype.options, {
	useLang: "en"
});
}));
