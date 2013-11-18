/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone', 'configuration', 'searchResults/model/featureCollection', 'search/model/dataSetPopulation', 'search/model/datasetSearch'],
	function($, Backbone, Configuration, FeatureCollection, DataSetPopulation, DatasetSearch) {


var SearchResults = {

	featureCollection : {
	},
	
	/** launch a search */
	launch : function(searchCriteria) {
		for ( var x in this.featureCollection ) {
			this.featureCollection[x].launch(searchCriteria);
		}
	},
	
	/** Get the product urls of the features */
	getProductUrls : function(features) {
		var productUrls = [];		
		for ( var i = 0; i < features.length; i++ ) {			
			var f = features[i];
			if ( f.properties && f.properties.productUrl ) {
				productUrls.push( f.properties.productUrl );
			}
		}
		return productUrls;
	},

	
	/** the direct download uses the eor.eop_ProductInformation.eop_filename and not the feature.properties.productUrl */
	getDirectDownloadProductUrls : function(features) {
		
		var productUrls = [];
		var eor;
		
		for ( var i = 0; i < features.length; i++ ) {
			eor = features[i].properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename && eor.eop_ProductInformation.eop_filename != "" ) {
				productUrls.push(eor.eop_ProductInformation.eop_filename);
			} 
			
		}
		return productUrls;
	},
	
	/** return the non Planned features */
	getNonPlannedItems : function(features) {
		
		var nonPlannedFeatures = [];
		var eoMeta;
		
		for ( var i = 0; i < features.length; i++ ) {
			eoMeta = features[i].properties.EarthObservation.EarthObservationMetaData;
			if ( eoMeta && eoMeta.eop_status && eoMeta.eop_status != "PLANNED") {
				nonPlannedFeatures.push(features[i]);
			} 	
		}
		return nonPlannedFeatures;
	},
	
	//the following method appends the download options using this convention &param_1=value1&....&param_n=value_n
	//kept here in case of any change !
//	/** After a download options selection change on results table, update the selected(checked) product urls 
//	 * with the new selected downloadOptions. The selectedDownloadOptions argument is a json object 
//	 * containing the selected download options.
//	 * 
//	 */
//	updateProductUrls: function(selectedDownloadOptions) {
//		
//		
//		_.each(this.selection, function(feature){
//			if ( feature.properties && feature.properties.productUrl  ) {
//				var url = feature.properties.productUrl;
//				console.log("product url initial = " + url);
//				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
//					//the download option is not set in the url
//					if (url.indexOf(optionKey) == -1){
//						//no parameters set in the url
//						if (url.indexOf("?") == -1){
//							url += "?" + optionKey + "=" + optionValue;
//						} else {//there are parameters in the url
//							url += "&" + optionKey + "=" + optionValue;
//						}
//					} else {
//						//the option has already been set : replace the existent value
//						var valueStartIndex = url.indexOf(optionKey) + optionKey.length + 1; //+1 to cover = after the param
//						var firstPart = url.substring(0, valueStartIndex);
//						//console.log("first part :: " + firstPart);
//						var valuePart = url.substring(valueStartIndex, url.length);
//						//console.log("value part :: " + valuePart);
//						var valueStopIndex = valuePart.indexOf("&");
//						
//						if (valueStopIndex == -1){//the value is the last value in the url
//							url = firstPart + optionValue;
//						}else{//option in the middle of the url
//							var remainingPart = valuePart.substring(valueStopIndex, url.length);
//							//console.log("remainingPart :: " + remainingPart);
//							url = firstPart +  optionValue + remainingPart;
//							
//						}					
//						
//					}
//				});	
//				console.log("product url updated = " + url);
//				feature.properties.productUrl =  url;
//			} 
//		});
//	},
	
	/** the following method appends the download options using this convention ngEO product URI :
	 *  it appends the download options to the product url as follows: &ngEO_DO={param_1:value1,....,param_n:value_n}
	 */
	updateProductUrls : function(selectedDownloadOptions) {
		
		_.each(this.selection, function(feature){
			if ( feature.properties && feature.properties.productUrl  ) {
				var url = feature.properties.productUrl;
				//console.log("product url initial = " + url);

				//remove the already added download options : this fixes the already existing bug :
				//when none is chosen the download option is not removed from the url
				if (url.indexOf("ngEO_DO={") != -1){
					var url = url.substring(0, url.indexOf("ngEO_DO={")-1);
					//console.log("product url removed download options  = " + url);
				}
				
				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
								
					//the download option is not set in the url

					if (url.indexOf("ngEO_DO={") != -1){//in that case the ngEO_DO={} is the last param according to the ICD
						
						var urlWithoutlastBaraket = url.substring(0, url.length-1);
						urlWithoutlastBaraket += "," + optionKey + ":" + optionValue + "}";
						url = urlWithoutlastBaraket;
					
					}else{//there are no download options already added
						
						if (url.indexOf("?") == -1){
							url += "?";
						} else {//there are parameters in the url
							url += "&";
						}
						url += "ngEO_DO={" + optionKey + ":" + optionValue + "}";
					
					}
				});	
				//console.log("product url updated = " + url);
				feature.properties.productUrl =  url;
			} 
		});
	},
	
	/**  Check whether the given feature has a direct download url supported by a browser */
	isBrowserSupportedUrl : function(feature) {

		var eor = feature.properties.EarthObservation.EarthObservationResult;
		if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename && eor.eop_ProductInformation.eop_filename != "" &&
				(eor.eop_ProductInformation.eop_filename.indexOf("http") != -1 ||
						eor.eop_ProductInformation.eop_filename.indexOf("https") != -1)) {
			return true;
		}	
		return false;
	},
	
};

// Add events
_.extend(SearchResults, Backbone.Events);

// Listen to selected dataset to create the feature collection used to store the results
DataSetPopulation.on('select', function(dataset) {
	var datasetId = dataset.get('datasetId');
	if (!SearchResults.featureCollection.hasOwnProperty(datasetId)) {
		var fc = new FeatureCollection();
		fc.id = datasetId;
		SearchResults.featureCollection[datasetId] = fc;
		SearchResults.trigger('add:featureCollection',fc);
	}
});

// Listen to unselected dataset to remove the feature collection used to store the results
DataSetPopulation.on('unselect', function(dataset) {
	var datasetId = dataset.get('datasetId');
	if (SearchResults.featureCollection.hasOwnProperty(datasetId)) {
		SearchResults.trigger('remove:featureCollection', SearchResults.featureCollection[datasetId] );
		delete SearchResults.featureCollection[datasetId];
	}
});

// Listen to search mode to take into acount correlation, interferometry search
DatasetSearch.on('change:mode', function(model,mode) {

	// Remove previous feature collection
	for ( var datasetId in SearchResults.featureCollection ) {
		SearchResults.trigger('remove:featureCollection', SearchResults.featureCollection[datasetId] );
		delete SearchResults.featureCollection[datasetId];
	}
		
	switch (mode) {
	case "Simple":
		for ( var datasetId in DataSetPopulation.selection ) {
			var fc = new FeatureCollection();
			fc.id = datasetId;
			SearchResults.featureCollection[datasetId] = fc;
			SearchResults.trigger('add:featureCollection',fc);
		}
		break;
	case "Correlation":
	case "Interferometry":
		var fc = new FeatureCollection();
		fc.id = mode;
		SearchResults.featureCollection[fc.id] = fc;
		SearchResults.trigger('add:featureCollection',fc);
		break;
	}
});

return SearchResults;

});