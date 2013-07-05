/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserShopCartsConfigData and IF-ngEO-ShopCartManagement
 * 
 */

//node dependency to generate randow ids for shopcarts.
var uuid = require('node-uuid');

module.exports = function(req, res){
	
	if (!req.params.id){	
	
		//Create shopcart : post of a shopcart
		if (!req.body.shopcart){		
		
			//IF-ngEO-UserShopCartsConfigData
			res.sendfile('./shopcarts/shopcarts.json');
		
		}else{
			if (req.body.name != ""){
				var response = req.body;
				response.id = uuid.v4();
				res.send(response);
			
			}else{
				//should not happen :the WEBC will forbid than case.
			}
		}		
	}else {

		//Rename shopcart : 
		if (req.body.shopcart){	
			var response = req.body;
			res.send(response);
		}
	}
};