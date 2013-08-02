/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserShopCartsConfigData and IF-ngEO-ShopCartManagement
 * 
 */

//nodeJs dependency to generate randow ids for shopcarts.
var uuid = require('node-uuid');
var fs = require('fs');

var shopcartConfigs = [];
var shopcartContents = [];


fs.readFile('./shopcarts/shopcarts.json', 'utf8', function (err, data) {
	shopcartConfigs  = JSON.parse(data).shopcarts;
});

fs.readFile('./shopcarts/shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents  = JSON.parse(data).items;
});

var doesShopcartExist = function(id){
	var found = false;
	for (var i=0; i<shopcartConfigs.length; i++){
		if (shopcartConfigs[i].id == id){
			found = true;
		}
	}
	return found;
};

/** delete the shopcart having the given id */
deleteShopcart = function(id){
	for (var i=0; i<shopcartConfigs.length; i++){
		if (shopcartConfigs[i].id == id){
			shopcartConfigs.splice(i, 1);
		}
	}
};

module.exports = {
	
	get : function(req, res){
	
		//shopcart content consulting
		if (req.params.id){

			if (doesShopcartExist(req.params.id)){
				res.sendfile('./shopcarts/' + req.params.id + '_shopcartContent.json');			
			}else{
				res.send(404);
			}
			
		}else{
			//IF-ngEO-UserShopCartsConfigData
			res.sendfile('./shopcarts/shopcarts.json');
		}
	},
	
	post : function(req, res){
		
		//Create shopcart : post of a shopcart without id
		if (!req.params.id && !req.body.id && req.body.name && req.body.name != ""){	
			var response = req.body;
			response.id = uuid.v4();
			res.send(response);
		}
		
		//add shopcart items : post of shopcart items
		if (req.params.id && req.body.items){
			var response = [];
			//add an id to each shopcart item
			for (var i=0; i<req.body.items.length; i++){
				response.push({"id" : uuid.v4() , "shopcartId" : req.body.items[i].shopcartId, "product" : req.body.items[i].product});
			}
			
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
		if (req.params.id && !req.body.items){	
			res.send({"id" : req.params.id});
			//uncomment to SIMULATE an ERROR
			//res.send(400);
		}
		
		if (req.params.id && req.body.items){	
			
			var ids = [];
			//send back the list of shopcart item ids
			for (var i=0; i<req.body.items.length; i++){
				ids.push({"id" : req.body.items[i].id});
			}
			
			res.send({"ids" : ids});
			
		}
	}
};
	
