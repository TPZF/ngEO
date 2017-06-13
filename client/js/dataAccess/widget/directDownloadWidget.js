var Configuration = require('configuration');
var DownloadManagers = require('dataAccess/model/downloadManagers');
var directDownload_template = require('dataAccess/template/directDownloadWidgetContent');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');

var DirectDownloadWidget = function(feature, url) {

	var parentElement = $('<div id="directDownloadPopup" data-role="popup" data-overlay-theme="a" class="popup-widget-background">');
	parentElement = parentElement.appendTo('.ui-page-active');

	/**
	 *	Open the popup
	 */
	this.open = function(event) {
		var _this = this;

		parentElement.bind({
			popupafterclose: function(event, ui) {
				parentElement.remove();
			}
		});

		// Create the content
		if (DownloadManagers.get('downloadmanagers').length >= 1) {
			parentElement.html(directDownload_template({
				url: url,
				downloadHelperUrl: Configuration.baseServerUrl + "/downloadHelper" + "?productURI=" + encodeURIComponent(url + '.ngeo')
			}));
		} else {
			parentElement.html(directDownload_template({
				url: url,
				downloadHelperUrl: false
			}));

			// Try to fetch again  the download manages to display the special link
			DownloadManagers.fetch().done(function() {
				parentElement.html(directDownload_template({
					url: url,
					downloadHelperUrl: Configuration.baseServerUrl + "/downloadHelper" + "?productURI=" + encodeURIComponent(url + '.ngeo')
				}));
				parentElement.trigger('create');
				if (!Configuration.data.behindSSO || !Configuration.data.downloadManager.enable) {
					parentElement.find('.viaDownloadManager').closest('li').hide();
				}
			});
		}

		parentElement.trigger('create');

		parentElement.popup();
		parentElement.popup("open", {
			x: event.pageX,
			y: event.pageY,
			positionTo: "origin"
		});

		if (!Configuration.data.behindSSO || !Configuration.data.downloadManager.enable) {
			parentElement.find('.viaDownloadManager').closest('li').hide();
		}
		
		parentElement.find('.viaDownloadManager').click( function() {
			SimpleDataAccessRequest.initialize();
			SimpleDataAccessRequest.setProducts([feature]);
			DataAccessWidget.open(SimpleDataAccessRequest);
			_this.close();
		});

	};


	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

module.exports = DirectDownloadWidget;