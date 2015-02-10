define(['jquery', 'configuration', 'searchResults/model/featureCollection'], 
        function ($, Configuration, FeatureCollection) {

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
				
				var fc = new FeatureCollection();

				fc.features.push( feature );
				fc.select( feature );
				
				fc.updateProductUrls({
					downloadMode: "OnCompletion"
				});
				
				//QUnit.equal( feature.properties.EarthObservation.EarthObservationResult.eop_ProductInformation.eop_filename, "http://dummy?downloadMode=OnCompletion" );
				QUnit.equal( feature.properties.productUrl, "http://dummy?ngEO_DO={downloadMode:OnCompletion}" );
				
				fc.updateProductUrls({
					downloadMode: "Continously"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?ngEO_DO={downloadMode:Continously}" );
			
				fc.updateProductUrls({
					downloadMode: "Continously",
					type: "PNG"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?ngEO_DO={downloadMode:Continously,type:PNG}" );
		
				fc.updateProductUrls({
					downloadMode: "Continously",
					type: "JPEG"
				});
				
				QUnit.equal( feature.properties.productUrl, "http://dummy?ngEO_DO={downloadMode:Continously,type:JPEG}" );
				
				fc.unselect( feature );
				fc.features = [];
		});		
});