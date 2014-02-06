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
	path = require('path');

var shopcartConfigs = [];
var shopcartContents = {};

fs.readFile('./shopcarts/shopcarts.json', 'utf8', function (err, data) {
	shopcartConfigs  = JSON.parse(data).shopCartList;
});


fs.readFile('./shopcarts/TPZ_SHP_01_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_01"]  = JSON.parse(data);
});

fs.readFile('./shopcarts/TPZ_SHP_02_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_02"]  = JSON.parse(data);
});

fs.readFile('./shopcarts/TPZ_SHP_03_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_03"]  = JSON.parse(data);
});

fs.readFile('./shopcarts/TPZ_SHP_04_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_04"]  = JSON.parse(data);
});

fs.readFile('./shopcarts/TPZ_SHP_05_shopcartContent.json', 'utf8', function (err, data) {
	shopcartContents["TPZ_SHP_05"]  = JSON.parse(data);
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
var deleteShopcart = function(id){
	for (var i=0; i<shopcartConfigs.length; i++){
		if (shopcartConfigs[i].id == id){
			shopcartConfigs.splice(i, 1);
		}
	}
};

var removeItem = function(shopcartContent,id) {
	for (var i=0; i<shopcartContent.features.length; i++){
		if (shopcartContent.features[i].properties.shopcartItemId == id){
			shopcartContent.features.splice(i, 1);
			return true;
		}
	}
	return false;
};

var findFeatureByProductUrl = function(features,url) {
	for (var i=0; i < features.length; i++){
		if (features[i].properties.productUrl == url){
			return true;
		}
	}
	return false;
};

var saveShopcartContent = function(id) {
	fs.writeFile('./shopcarts/' + id + '_shopcartContent.json', JSON.stringify(shopcartContents[id],null,'\t'), 'utf8');
}

module.exports = {
	
	get : function(req, res){
	
		//shopcart content consulting
		if (req.params.id){
			
			if (doesShopcartExist(req.params.id)){
			
				if (!req.params.format){
					
					res.sendfile('./shopcarts/' + req.params.id + '_shopcartContent.json');		
				
				}else{
					
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
					
					if (filePath){
					
					    var stat = fs.statSync(filePath);
	
					    res.writeHead(200, {
					        'Content-Type': contentType,
					        'Content-Length': stat.size,
					        'Content-Disposition' : "attachment; filename="+ fileName 
					    });
	
					    var readStream = fs.createReadStream(filePath);
					    readStream.pipe(res);
					
					}else{
						res.send(404);
					}
				}
			
			}else{
				res.send(404);
			}
			
		}else{
			//IF-ngEO-UserShopCartsConfigData
			res.sendfile('./shopcarts/shopcarts.json');
			//res.send(500);
		}
	},
	
	post : function(req, res){
		
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
		//add shopcart items : post of shopcart items
		else if (req.params.id && req.body.shopCartItemAdding) {
			var response = {
				shopCartItemAdding: []
			};
			
			var waitingRequests = req.body.shopCartItemAdding.length;
			var id;
			//add an id to each shopcart item
			for (var i=0; i<req.body.shopCartItemAdding.length; i++){		
				
				if ( findFeatureByProductUrl( shopcartContents[req.params.id].features, req.body.shopCartItemAdding[i].product ) ) {
					waitingRequests--;
					if ( waitingRequests == 0 ) {
						//save the new content of the shopcart 
						saveShopcartContent(req.params.id);
						res.send(response);	
					}
					continue;
				}
				
				http.get(req.body.shopCartItemAdding[i].product, function(r) {
					
					if ( r.statusCode == 200 ) {
						r.on('data', function (chunk) {
							var feature = JSON.parse(chunk);
							id = uuid.v4();
							
							//Set the shopcart item id on the feature
							feature.properties.shopcartItemId = id;
							shopcartContents[req.params.id].features.push(feature);
							
							// Add to the response
							response.shopCartItemAdding.push({"id" : id, "shopcartId" : req.params.id, "product" : feature.properties.productUrl});
							
							//console.log( req.params.id + ' : ' + shopcartContents[req.params.id].items.length );
							waitingRequests--;
							if ( waitingRequests == 0 ) {
								//save the new content of the shopcart 
								saveShopcartContent(req.params.id);
								res.send(response);	
							}
						});
					} else  {
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
			res.send(400 );
		}
	},
	
	put : function(req, res){
		//Rename shopcart 
		if (req.params.id && req.body.name){	
			var response = req.body;
			res.send(response);
		}
	}, 
	
	delete : function(req, res){
		//delete shopcart 
		if (req.params.id && !req.body.shopCartItemRemoving){	
			res.send({"id" : req.params.id});
		}
		else if (req.params.id && req.body.shopCartItemRemoving){	
			
			var removedItems = [];
			
			//console.log( req.params.id );
			//console.log( req.body );
			//console.log( shopcartContents[req.params.id] );
						
			//send back the list of shopcart item ids
			for (var i=0; i<req.body.shopCartItemRemoving.length; i++){
				if (removeItem( shopcartContents[req.params.id], req.body.shopCartItemRemoving[i].id )) {
					removedItems.push({"id" : req.body.shopCartItemRemoving[i].id, "shopcartId": req.params.id});
				}
			}
			fs.writeFile('./shopcarts/' + req.params.id + '_shopcartContent.json', JSON.stringify(shopcartContents[req.params.id],null,'\t'), 'utf8');
			res.send({"shopCartItemRemoving" : removedItems});
			
		}
		else {
			res.send(400);
		}
	}
};
	
