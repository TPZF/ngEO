/**
 * Utility module to convert decimal degree to degree/minute/second and vice versa.
 */
module.exports = {
	/**
	 * Utility method to convert coordinates from decimal degree to
	 * degree/minute/second.
	 * 
	 * @param dd
	 *            coordinates in decimal degrees
	 * @param isLon
	 *            flag indicating if coordinates is on longitude or not
	 * @param options
	 *		- sep
	 *            separator
	 *		- positionFlag
	 *			  'letter': EW/NS at the end
	 *			  'number': +/- at the beginning
	 * @return coordinates in degree/minute/second
	 */
	toDMS: function(dd, isLon, options = {}) {

		var deg = dd | 0; // truncate dd to get degrees
		var frac = Math.abs(dd - deg); // get fractional part
		var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
		var sec = (frac * 3600 - min * 60) | 0;
		var res = Math.abs(deg) + (options.sep || "°") + min + (options.sep || "'") + sec + (options.sep || '"');
		var positionFlag;
		if ( options.positionFlag == "letter" ) {
			positionFlag = "";
			if (isLon) {
				positionFlag = (dd >= 0) ? "E" : "W";
			} else {
				positionFlag = (dd >= 0) ? "N" : "S";
			}
			return res + positionFlag;
		} else {
			positionFlag = (dd >= 0) ? "" : "-";
			return positionFlag + res;
		}
	},

	/**
	 * Utility method to convert coordinate from degree/minute/second to
	 * decimal degrees.
	 * 
	 * @param dms
	 *            coordinate in degree/minute/second
	 * @return coordinate in decimal degrees.
	 */
	toDecimalDegrees: function(dms) {
		var dmsRe = /^\s*(-?)(\d+)°(\d+)'(\d+)"([EWNS]{0,1})\s*$/;
		var match = dmsRe.exec(dms);

		if (match) {

			var coordinate = parseFloat(match[2]) + (parseFloat(match[3]) / 60.0) + (parseFloat(match[4]) / 3600.0);
			coordinate *= (match[4] == 'W' || match[4] == 'S' || match[1] == "-") ? -1.0 : 1.0;

			return coordinate;
		} else {
			return Number.NaN;
		}
	},

	/**
	 * Utility method to convert coordinates from text in degree/minute/second to array of decimal
	 * degrees coordinates.
	 * NB: lat/lon convention is used
	 * 
	 * @param dms
	 *            text containing coordinates in degree/minute/second
	 * @return array of coordinates extracted from DMS text. Empty array if regexp don't found match. 
	 */
	textToDecimalDegrees: function(text) {
		var coordinates = [];
		var polygonRe = /\s*(-?)(\d+)°(\d+)'(\d+)"([NS]{0,1})\s+(-?)(\d+)°(\d+)'(\d+)"([EW]){0,1}/gm;
		var match = polygonRe.exec(text);

		while (match) {
			var lat = parseFloat(match[2]) + (parseFloat(match[3]) / 60.0) + (parseFloat(match[4]) / 3600.0);
			var lon = parseFloat(match[7]) + (parseFloat(match[8]) / 60.0) + (parseFloat(match[9]) / 3600.0);
			lat *= (match[5] == 'S' || match[1] == "-") ? -1.0 : 1.0;
			lon *= (match[10] == 'W' || match[6] == "-") ? -1.0 : 1.0;
			coordinates.push([lon, lat]);
			match = polygonRe.exec(text);
		}

		return coordinates;
	}
};