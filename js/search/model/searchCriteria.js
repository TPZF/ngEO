  
define( ['jquery', 'backbone', 'configuration', 'search/model/searchArea'], 
		function($, Backbone, Configuration, SearchArea) {

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// Helper function to convert a string in ISO format to date
Date.fromISOString = function(str) {

	var reDate = /(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+)(?::(\d+)(?:.(\d+))?)?Z)?/;
	var match = reDate.exec(str);
	if ( match ) {
		// Hack to support bad date
		if ( match[1].length < match[3].length ) {
			var tmp = match[1];
			match[1] = match[3];
			match[3] = tmp;
		}
		var date = new Date();
		date.setUTCFullYear(match[1]);
		date.setUTCMonth(match[2]-1);
		date.setUTCDate(match[3]);
		date.setUTCHours(match[4] || 0);
		date.setUTCMinutes(match[5] || 0);
		date.setUTCSeconds(match[6] || 0);
		date.setUTCMilliseconds(match[7] || 0);
		return date;
	} else {
		throw "Invalid ISO date";
	}
};

// Helper function to convert a date to an iso string, only the date part
Date.prototype.toISODateString = function() {
	return this.getUTCFullYear() + "-" + pad(this.getUTCMonth()+1,2) + "-" + pad(this.getUTCDate(),2);
};

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

/**
 * This backbone model holds the search criteria attributes
 *
 */
var SearchCriteria = Backbone.Model.extend({
	
	/**	
	 * Constructor
	 */
	initialize : function() {
		// The search area
		this.searchArea = new SearchArea();
	},
	 
	/** 
	 * Remove all advanced attributes and download options
	 * The option silent is set to true to avoid firing unused events.
	 */ 
	clearAdvancedAttributesAndDownloadOptions : function(){
		
		var self = this;			
	
		//remove selected search criteria
		_.each(this.get('advancedAttributes'), function(attribute){
			if (self.has(attribute.id)) {
				self.unset(attribute.id, {silent: true});
			}
		});			

		_.each(this.get('downloadOptions'), function(option){
			if (self.has(option.argumentName)){
				self.unset(option.argumentName, {silent: true});
			}				
		});
			
	},
	
	/** Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL : function(id){

		var url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		url += id + "/search?";
		url += this.getOpenSearchParameters();
		url += "&format=json";
		
		return url;
	},

		
	/** get the url without base url with all search criteria */
	getOpenSearchParameters : function(){
		
		//add area criteria if set
		var params = this.addGeoTemporalParams();
		
		//always add the advanced criteria values selected and already set to the model
		params = this.addAdvancedCriteria(params);

		//add the download options values selected and already set to the model
		params = this.addDownloadOptionsWithProductURIConvention(params);
		
		//console.log("DatasetSearch module : getCoreURL method : " + url);
		
		return params;
	},
	
	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		var url = "#data-services-area/search/" +  this.getDatasetPath() + '?';
		url += this.getOpenSearchParameters();
		return url;
	},
	
	/**
	 * Populate the model with the parameters retrieved from the Shared URL
	 */
	populateModelfromURL : function(query){
			
		var vars = query.split("&");
		
		// Force useExtent to false to avoid bug when setting the geometry
	    var attributes = { 'useExtent': false };
		
	    for (var i = 0; i < vars.length; i++) {
	        
	    	var pair = vars[i].split("=");
			if (pair.length != 2) 
				throw "Invalid OpenSearch URL : parameter " + vars[i] + "not correctly defined."
	    		
			switch (pair[0]) {
				case "bbox": 
					var coords = pair[1].split(",");
					if ( coords.length != 4 )
						throw "Invalid OpenSearch URL : bbox parameter is not correct."
					this.searchArea.setBBox({west : coords[0],south : coords[1],east : coords[2],north: coords[3]});
					break;
				case "geom":
					// TODO : check polygon is correct
					this.searchArea.setFromWKT(pair[1]);
					break;
				case "start" : 
					try {
						attributes['start'] = Date.fromISOString(pair[1]);
					} catch (err) {
						throw "Invalid OpenSearch URL : start parameter is not correct."
					}
					break;
				case "stop" : 
					try {
					attributes['stop'] = Date.fromISOString(pair[1]);
					} catch (err) {
						throw "Invalid OpenSearch URL : stop parameter is not correct."
					}
					break;
					
				default :
					
					if ( this.has(pair[0]) ) {
						attributes[pair[0]] = pair[1];
					} else {
						//set the parameters if there are advanced attributes, download options or attributes of the model
						//skip any other parameter
						if ( this.get('advancedAttributes').hasOwnProperty(pair[0]) ) {
							attributes[pair[0]] = pair[1];
						}
						else if ( this.get('downloadOptions').hasOwnProperty(pair[0]) ) {
							attributes[pair[0]] = this.get('downloadOptions')[pair[0]].cropProductSearchArea ? true : pair[1];
						}
					}
					break;
			}
					
	   	}
				
	    this.set(attributes);
		
		// Manual trigger of a change:searchArea event because SearchArea is not (yet?) a Backbone model
		this.trigger('change:searchArea');

	},

	//add date WITHOUT cf ngeo 368 time and area parameters
	addGeoTemporalParams : function () {
	
		var params = "start=" + this.get("start").toISOString()  + "&" + 
		"stop=" + this.get("stop").toISOString();

		params += "&" + this.searchArea.getOpenSearchParameter( Configuration.get("search.geometryPrecision",2) );
		
		//console.log("DatasetSearch module : addGeoTemporalParams : " + url);
		return params;
	},
	
	//add advanced criteria to the given url
	addAdvancedCriteria : function(url) {
		
		var self = this;
		
		//add the advanced criteria not set in the model ie not changed by the user
		//with their default values from the dataset 
		var advancedAttributes = this.get('advancedAttributes');
		if (advancedAttributes) {
					
			_.each(advancedAttributes, function(attribute){

				// Check if the avanced attribute has a value in the DatasetSearch
				if ( self.has(attribute.id) ) {
					url += '&' + attribute.id + '=' + self.get(attribute.id);
				}
				
			});
		}
		
		//console.log("DatasetSearch module : addAdvancedCriteria : " + url);
		return url;
	},
	
	/**
	 * add download options to the given url by appending "&param_1=value_1&...&param_n=value_n" to the url
	 * returns the modified url
	 */
	addDownloadOptions : function(url) {
	
		var self = this;
		//add the selected download options to the opensearch url					
		_.each(this.get('downloadOptions'), function(option){
			
			if ( self.has(option.argumentName) ) {
				if ( !option.cropProductSearchArea ) {
					url += '&' + option.argumentName + '=' + self.get(option.argumentName);
				} else if ( self.get(option.argumentName) ) {
					url += '&' + option.argumentName + '=' + self.searchArea.toWKT(); 
				}
				
			}
		});

		//console.log("DatasetSearch module : addDownloadOptions : " + url);
		return url;
	},
	
	/**
	 * In case there are selected download options : 
	 * 		add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
	 * 		to the url and returns the modified url.
	 * otherwise : do not append "&ngEO_DO={} to the url 
	 */
	addDownloadOptionsWithProductURIConvention : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url		
				
		var downloadOptionsStr = null;
		var addedOption = false;
		
		_.each(this.get('downloadOptions'), function(option, index){
			
			if (_.has(self.attributes, option.argumentName)) {
				
				if (!addedOption){
					downloadOptionsStr = "&ngEO_DO={";
				}else{
					downloadOptionsStr += ",";
				}
				
				if ( !option.cropProductSearchArea ) {
					
					downloadOptionsStr += option.argumentName + ':' + self.attributes[option.argumentName];
					
				} else if (self.attributes[option.argumentName]) {
					
					downloadOptionsStr += option.argumentName + ':' + self.searchArea.toWKT(); 
				}

				if (!addedOption){
					addedOption = true;
				}
			}
		});
		
		if (downloadOptionsStr) {
			downloadOptionsStr += "}";
			url += downloadOptionsStr;
		}
			

		//console.log("DatasetSearch module : addDownloadOptionsWithProductURIConvention : " + url);
		return url;
	},

	
	/** Get the selected download options as a json object.
	 * If the download options have been changed by the user, their are set as an attribute to the DatasetSearch
	 * otherwise the default value is got from the dataset.
	 */
	getSelectedDownloadOptions : function() {
		
		var selectedOptions = {};
		var self = this;
		
		//add the options set to the model ie changed by the user with the selected value
		//add options not set in the model ie not changed by the user with their default values from the dataset 
		_.each( this.get('downloadOptions'), function(option){
			
			if (_.has(self.attributes, option.argumentName)){
				selectedOptions[option.argumentName] = self.attributes[option.argumentName] ;
			}
			});
		//console.log("Selected download options of dataset : " + this.dataset.attributes.datasetId + " : ");
		//console.log(selectedOptions);
		
		return selectedOptions;
	},
	
});

return SearchCriteria;

});