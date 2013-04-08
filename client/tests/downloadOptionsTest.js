define(['jquery', 'configuration', 'searchResults/model/searchResults'], 
        function ($, Configuration, SearchResults) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("DownloadOptions", {
	    	setup: function() {
	
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done();
	    	}
	    });
    
	
    
    	QUnit.test("Download options assignement", function () {
    					
				// Create a dummy feature
				var feature = {
					properties: {
						productUrl: "http://dummy",
						EarthObservation: {
							EarthObservationResult : {
								eop_ProductInformation: {
									eop_filename: "http://dummy"
								}
							}
						}
					}
				};
				
				SearchResults.features.push( feature );
				SearchResults.select( feature );
				
				SearchResults.updateProductUrls({
					downloadMode: "OnCompletion"
				});
				
				//QUnit.equal( feature.properties.EarthObservation.EarthObservationResult.eop_ProductInformation.eop_filename, "http://dummy?downloadMode=OnCompletion" );
				QUnit.equal( feature.properties.productUrl, "http://dummy?downloadMode=OnCompletion" );
				
				SearchResults.updateProductUrls({
					downloadMode: "Continously"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?downloadMode=Continously" );
			
				SearchResults.updateProductUrls({
					type: "PNG"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?downloadMode=Continously&type=PNG" );
		
				SearchResults.updateProductUrls({
					type: "JPEG"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?downloadMode=Continously&type=JPEG" );
				
				SearchResults.unselect( feature );
				SearchResults.features = [];
		});		
});