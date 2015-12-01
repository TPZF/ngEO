/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserShopCartsConfigData and IF-ngEO-ShopCartManagement
 * 
 */

//nodeJs dependency to generate randow ids for shopcarts.
var uuid = require('node-uuid'),
	fs = require('fs'),
	http = require('http'),
	path = require('path'),
	find = require('lodash.find'),
	Configuration = require('../webClientConfigurationData/configuration'),
	logger = require('../utils/logger');


var shopcartContents = {};
var shopcartConfigs = [
    {
        "id" : "TPZ_SHP_01",
        "name" : "S1 product's shopcart",
        "userId" : "TPZ_user_01",
        "isDefault" : true
    },
    {
        "id" : "TPZ_SHP_02",
        "name" : "S2 product's shopcart",
        "userId" : "TPZ_user_01",
        "isDefault" : false
    },
     {
        "id" : "TPZ_SHP_03",
        "name" : "S3 product's shopcart",
        "userId" : "TPZ_user_01",
        "isDefault" : false
    },
    {
        "id" : "TPZ_SHP_04",
        "name" : "SAR product's shopcart",
        "userId" : "TPZ_user_01",
        "isDefault" : false
    },
    {
        "id" : "TPZ_SHP_05",
        "name" : "Optical product's shopcart",
        "userId" : "TPZ_user_01",
        "isDefault" : false
    }
];


fs.readFile('./shopcarts/TPZ_SHP_01_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_01"]  = Configuration.toNewJsonFormat(JSON.parse(data));
});

fs.readFile('./shopcarts/TPZ_SHP_02_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_02"]  = Configuration.toNewJsonFormat(JSON.parse(data));
});

fs.readFile('./shopcarts/TPZ_SHP_03_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_03"]  = Configuration.toNewJsonFormat(JSON.parse(data));
});

fs.readFile('./shopcarts/TPZ_SHP_04_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_04"]  = Configuration.toNewJsonFormat(JSON.parse(data));
});

fs.readFile('./shopcarts/TPZ_SHP_05_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_05"]  = Configuration.toNewJsonFormat(JSON.parse(data));
	for ( var i = 6; i <= 100; i++ ) {
		shopcartContents["TPZ_SHP_" + i]  = Configuration.toNewJsonFormat(JSON.parse(data));
		shopcartConfigs.push({
                    "id" : "TPZ_SHP_" + i,
                    "name" : "Shopcart " + i,
                    "userId" : "TPZ_user_01",
                    "isDefault" : false
                });
	}
});


/**
 *	Check if shopcart exists
 */
var doesShopcartExist = function(id){
	var found = false;
	for (var i=0; i<shopcartConfigs.length; i++){
		if (shopcartConfigs[i].id == id){
			found = true;
		}
	}
	return found;
};

/**
 * Delete the shopcart having the given id
 */
var deleteShopcart = function(id){
	for (var i=0; i<shopcartConfigs.length; i++){
		if (shopcartConfigs[i].id == id){
			shopcartConfigs.splice(i, 1);
		}
	}
};

/**
 *	Remove item from the given shopcart
 */
var removeItem = function(shopcartContent,id) {
	for (var i=0; i<shopcartContent.features.length; i++){
		if (shopcartContent.features[i].properties.shopcartItemId == id){
			shopcartContent.features.splice(i, 1);
			return true;
		}
	}
	return false;
};

/**
 *	Find feature by the given product url
 */
var findFeatureByProductUrl = function(features,url) {
	for (var i=0; i < features.length; i++) {
		var feature = features[i];
		var productUrl = find(feature.properties.links, {'@rel': 'self'})['@href'];
		if (productUrl == url){
			return true;
		}
	}
	return false;
};

var saveShopcartContent = function(id) {
	fs.writeFile('./shopcarts/' + id + '_shopcartContent.json', JSON.stringify(shopcartContents[id],null,'\t'), 'utf8');
}

module.exports = {
	
	/**
	 *	List shopcarts
	 */
	list : function(req, res) {
		res.send({  "shopCartList" : shopcartConfigs });
	},
	
	/**
	 *	Get content of the given shopcart
	 */
	getContent: function(req,res) {
			
		if (doesShopcartExist(req.params.id)) {
		
			if (!req.params.format) {
				
				var shopcartContent = shopcartContents[req.params.id];
				
				// Remove shopcart item id for test
				/*for ( var i = 0; i < shopcartContent.features.length; i++ ) {
					delete shopcartContent.features[i].properties.shopcartItemId;
				}*/
				
				res.send( shopcartContent );		
			
			} else {
				
				var filePath, contentType, fileName;
				
				switch(req.params.format){
					case "KML" : 
						fileName = 'shopcart.kml';
						filePath = path.join('./shopcarts/', fileName);
						contentType = 'application/vnd.google-earth.kml+xml';
						break;
					case "ATOM" :
						fileName = 'shopcart.atom';
						filePath = path.join('./shopcarts/', fileName);
						contentType = 'application/atom+xml';
						break;
					case "HTML" : 
						fileName = 'shopcart.html';
						filePath = path.join('./shopcarts/', fileName);
						contentType = 'text/html';
						break;
					default: 
						filePath = null;
						break;
				}
				
				if (filePath) {
				
					var stat = fs.statSync(filePath);

					res.writeHead(200, {
						'Content-Type': contentType,
						'Content-Length': stat.size,
						'Content-Disposition' : "attachment; filename="+ fileName 
					});

					var readStream = fs.createReadStream(filePath);
					readStream.pipe(res);
				
				} else {
					res.send(404);
				}
			}
		
		} else {
			res.send(404);
		}
	},
	
	/**
	 * Create a new shopcart
	 */
	create : function(req, res) {
		
		//Create shopcart : post of a shopcart without id
		if (!req.params.id && !req.body.id && req.body.createShopcart && req.body.createShopcart.shopcart && req.body.createShopcart.shopcart.name != "") {	
			var response = req.body.createShopcart.shopcart;
			response.id = uuid.v4();
			shopcartConfigs.push(response);
			shopcartContents[response.id] = {
				type: "FeatureCollection",
				features: []
			};
			
			saveShopcartContent(response.id);
			res.send(response);
		}
	},
	
	/**
	 * Add items to shopcart
	 */
	addItems: function(req,res) {

		logger.debug( "Inserting " + req.params.id );
		//add shopcart items : post of shopcart items
		if (req.params.id && req.body.shopCartItemAdding) {
			var response = {
				shopCartItemAdding: []
			};
			
			if ( req.body.shopCartItemAdding.length == 0 ) {
				res.send(response);	
			}
			
			var waitingRequests = req.body.shopCartItemAdding.length;
			var id;
			//add an id to each shopcart item
			for (var i=0; i<req.body.shopCartItemAdding.length; i++) {		
				
				if ( findFeatureByProductUrl( shopcartContents[req.params.id].features, req.body.shopCartItemAdding[i].product ) ) {
					waitingRequests--;
					if ( waitingRequests == 0 ) {
						//save the new content of the shopcart 
						saveShopcartContent(req.params.id);
						res.send(response);	
					}
					continue;
				}
				
				logger.debug("Product URL " + req.body.shopCartItemAdding[i].product );
				
				http.get(req.body.shopCartItemAdding[i].product, function(r) {
					
					if ( r.statusCode == 200 ) {
						r.on('data', function (chunk) {
							var feature = JSON.parse(chunk);
							id = uuid.v4();
							
							//Set the shopcart item id on the feature
							feature.properties.shopcartItemId = id;
							shopcartContents[req.params.id].features.push(feature);
							
							var productUrl = find(feature.properties.links, {'@rel': 'self'})['@href'];
							// Add to the response
							response.shopCartItemAdding.push({"id" : id, "shopcartId" : req.params.id, "product" : productUrl});
							
							logger.debug( req.params.id + ' : ' + shopcartContents[req.params.id].features.length );
							waitingRequests--;
							if ( waitingRequests == 0 ) {
								//save the new content of the shopcart 
								saveShopcartContent(req.params.id);
								res.send(response);	
							}
						});
					} else {
							waitingRequests--;
							if ( waitingRequests == 0 ) {
								//save the new content of the shopcart 
								saveShopcartContent(req.params.id);
								res.send(response);	
							}
					}

				});	
			}
		} else {
			res.send(400);
		}
	},
	
	/**
	 *	Add/update shopcart
	 */
	put : function(req, res) {
		//Rename shopcart 
		if (!req.body.createShopcart.shopcart.name) {
			res.send(500);
		} else {
			var response = req.body;		
			res.send(response);
		}
		
	}, 
	
	/**
	 *	Delete shopcart
	 *	Doesn't delete actually, just sends the id of deleted shopcart
	 */
	deleteShopcart : function(req, res) {
		res.send({"id" : req.params.id});
	},
	
	/**
	 *	Delete shopcart items
	 */
	deleteItems : function(req, res) {
		if (req.params.id && req.body.shopCartItemRemoving) {	
		
			var removedItems = [];
			
			logger.debug( "Deleting " + req.params.id );
			logger.debug( req.body );
			logger.debug( shopcartContents[req.params.id] );
						
			//send back the list of shopcart item ids
			for (var i=0; i<req.body.shopCartItemRemoving.length; i++){
				if (req.body.shopCartItemRemoving[i].id && removeItem( shopcartContents[req.params.id], req.body.shopCartItemRemoving[i].id )) {
					removedItems.push({"id" : req.body.shopCartItemRemoving[i].id, "shopcartId": req.params.id});
				}
			}
			fs.writeFile('./shopcarts/' + req.params.id + '_shopcartContent.json', JSON.stringify(shopcartContents[req.params.id],null,'\t'), 'utf8');
			res.send({"shopCartItemRemoving" : removedItems});
			
		} else {
			res.send(400);
		}
	}
};
	
