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
	 * @return coordinates in degree/minute/second
	 */
	toDMS: function(dd, isLon, sep) {
		var positionFlag = "";
		if (isLon) {
			positionFlag = (dd >= 0) ? "E" : "W";
		} else {
			positionFlag = (dd >= 0) ? "N" : "S";
		}

		var deg = dd | 0; // truncate dd to get degrees
		var frac = Math.abs(dd - deg); // get fractional part
		var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
		var sec = (frac * 3600 - min * 60) | 0;
		return Math.abs(deg) + (sep || "°") + min + (sep || "'") + sec + (sep || '"') + positionFlag;
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
		var dmsRe = /^\s*(\d+)°(\d+)'(\d+)"([EWNS]{1})\s*$/;
		var match = dmsRe.exec(dms);

		if (match) {

			var coordinate = parseFloat(match[1]) + (parseFloat(match[2]) / 60.0) + (parseFloat(match[3]) / 3600.0);
			coordinate *= (match[4] == 'W' || match[4] == 'S') ? -1.0 : 1.0;

			return coordinate;
		} else {
			return Number.NaN;
		}
	},

	/**
	 * Utility method to convert coordinates from text in degree/minute/second to array of decimal
	 * degrees coordinates.
	 * 
	 * @param dms
	 *            text containing coordinates in degree/minute/second
	 * @return array of coordinates extracted from DMS text. Empty array if regexp don't found match. 
	 */
	textToDecimalDegrees: function(text) {
		var coordinates = [];
		var polygonRe = /\s*(\d+)°(\d+)'(\d+)"([EW]{1})\s+(\d+)°(\d+)'(\d+)"([NS]){1}/gm;
		var match = polygonRe.exec(text);

		while (match) {
			var lon = parseFloat(match[1]) + (parseFloat(match[2]) / 60.0) + (parseFloat(match[3]) / 3600.0);
			var lat = parseFloat(match[5]) + (parseFloat(match[6]) / 60.0) + (parseFloat(match[7]) / 3600.0);
			lon *= (match[4] == 'W') ? -1.0 : 1.0;
			lat *= (match[8] == 'S') ? -1.0 : 1.0;
			coordinates.push([lon, lat]);
			match = polygonRe.exec(text);
		}

		return coordinates;
	}
};