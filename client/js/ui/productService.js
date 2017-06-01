var Logger = require('logger');

var _productsHighlighted = [];
var _productsChecked = [];
var _productsBrowsed = [];

module.exports = {

    // for highlighted products
    addHighlightedProducts: function(features) {
		_productsHighlighted = _.uniq(_.union(_productsHighlighted, features), 'id');
    },

    getHighlightedProducts: function() {
        return _productsHighlighted;
    },

    removeHighlightedProducts: function(features) {
        _productsHighlighted = _.difference(_productsHighlighted, features);
    },

    resetHighlightedProducts: function(features) {
        _productsHighlighted = [];
    },

    // for browsed products
    addBrowsedProducts: function(features) {
        _productsBrowsed =  _.uniq(_.union(_productsBrowsed, features), 'id');
    },

    getBrowsedProducts: function() {
        return _productsBrowsed;
    },

    removeBrowsedProducts: function(features) {
        _productsBrowsed = _.difference(_productsBrowsed, features);
    },

    resetBrowsedProducts: function(features) {
        _productsBrowsed = [];
    },

    // for checked products
    addCheckedProducts: function(features) {
        _productsChecked =  _.uniq(_.union(_productsChecked, features), 'id');
    },

    getCheckedProducts: function() {
        return _productsChecked;
    },

    removeCheckedProducts: function(features) {
        _productsChecked = _.difference(_productsChecked, features);
    },

    resetCheckedProducts: function(features) {
        _productsChecked = [];
    }
};
