/*
 * Basic user management
 */

var id = "public";

module.exports = {
	change: function(req, res) {
		id = req.params.id;
		res.send('User is ' + id );
	},
	
	getId: function() {
		return id;
	}
};
