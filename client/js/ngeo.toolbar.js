
define(['jquery'], function() {

return {

	addAction: function( id, text ) {
		var html = '<div class="tb-elt"><img id="' + id + '" class="tb-button button" src="images/' + id + '.png" /><div class="tb-text">' + text + '</div></div>';
		$("#toolbar").append(html);
	}
};

});