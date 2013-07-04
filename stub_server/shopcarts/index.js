/*
 * GET download managers list or the response for a download manager status change 
 * 
 * IF-ngEO-UserShopCartsConfigData and IF-ngEO-ShopCartManagement
 * 
 */

module.exports = function(req, res){
	
	//IF-ngEO-UserShopCartsConfigData
	res.sendfile('./shopcarts/shopcarts.json');

};