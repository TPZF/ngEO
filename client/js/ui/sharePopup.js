/**
  * Widget module
  */


define( [ "jquery", "text!ui/template/sharePopup.html", "underscore", "jquery.mobile" ], function($, sharePopup_html) {

var $popup;

return {
	open: function(options) {
		if (!$popup) {
			$popup = $(sharePopup_html);
			
			$popup.find('#sharedUrlLinks a')
				.addClass('tb-elt')
				.wrapInner('<div class="tb-text"></div>')
				.prepend('<div class="tb-icon"></div>')
				.click( function() {
					$popup.popup('close');
				});
			
			$popup.appendTo('.ui-page-active');
			
			$popup.popup();
			$popup.trigger('create');
			
			$popup.find('#sharedUrlLinks a')
				.removeClass('ui-link')
		}
		
		var url = options.url;
		// NGEO-1774: Shared url is passed by sharedUrl parameter, since '#' is filtered by UM-SSO
		var sharedUrl = encodeURIComponent(window.location.origin + window.location.pathname + url.substr(url.indexOf("/sec/") + "/sec/".length));
		url = window.location.origin + window.location.pathname + "?sharedUrl=" + sharedUrl;
		
		$("#facebook").attr( 'href', 'https://www.facebook.com/sharer.php?u=' + encodeURIComponent(url) );
		$("#twitter").attr( 'href', 'http://twitter.com/intent/tweet?status=' + encodeURIComponent(url) );
		$("#email").attr( 'href', 'mailto:?body=' + encodeURIComponent(url) );
		$("#raw").attr( 'href', url);
		$popup.popup('open', options);
	}
};

return openShareWidget;

});
