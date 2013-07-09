/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserShopCartsConfigData and IF-ngEO-ShopCartManagement
 * 
 */

//

//nodeJs dependency to generate randow ids for shopcarts.
var uuid = require('node-uuid');
var fs = require('fs');

fs.readFile('./shopcarts/shopcarts.json', 'utf8', function (err, data) {
	shopcarts  = JSON.parse(data);
});

fs.readFile('./shopcarts/shopcartContent.json', 'utf8', function (err, data) {
	shopcartItems  = JSON.parse(data);
});

var doesShopcartExist = function(id){
	for (var i=0; i<shopcarts.length; i++){
		if (shopcarts[i].id == id){
			return true;
		}
	}
	return false;
};

/** delete the shopcart having the given id */
deleteShopcart = function(id){
	for (var i=0; i<shopcarts.length; i++){
		if (shopcarts[i].id == id){
			shopcarts.splice(i, 1);
		}
	}
};

module.exports = {
	
	get : function(req, res){
	
		//shopcart content consulting
		if (req.params.id){	
			res.sendfile('./shopcarts/shopcartContent.json');
			
		}else{
			//IF-ngEO-UserShopCartsConfigData
			res.sendfile('./shopcarts/shopcarts.json');
		}
	},
	
	post : function(req, res){
		
		//Create shopcart : post of a shopcart without id
		if (!req.body.id && req.body.name != ""){	
			var response = req.body;
			response.id = uuid.v4();
			res.send(response);
		}	
	},
	
	put : function(req, res){
		//Rename shopcart 
		if (req.body.id && req.body.name){	
			var response = req.body;
			res.send(response);
		}
	}, 
	
	delete : function(req, res){
		//delete shopcart 
		if (req.params.id && !req.params.items){	
			res.send({"id" : req.params.id});
			//uncomment to SIMULATE an ERROR
			//res.send(400);
		}
		
	}
};
	
