"use strict";

var Configuration = require("configuration");

module.exports = {
	initialize: function(confPath) {
		// MS: Ugly hack to find the relative path to configuration
		Configuration.url = confPath ? confPath : "conf";
		Configuration.load().done(function() {
			$("body .contactUs").attr("href", "mailto:" + Configuration.get("mailto"));
			$("body footer").append('<span>Client ' + Configuration.localConfig.version + ' - Server ' + Configuration.data.version + '</span>');
		});
	}
};