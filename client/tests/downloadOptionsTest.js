define(['jquery', 'configuration', 'searchResults/model/featureCollection'], 
        function ($, Configuration, FeatureCollection) {

	    // Define the QUnit module and lifecycle.
	    QUnit.module("DownloadOptions", {
	    	setup: function() {
				stop();
	    		Configuration.url = Configuration.baseServerUrl +"/webClientConfigurationData";
	    		Configuration.load().done(function() {
	    			start();
	    		});
	    	}
	    });
    
	
    
    	QUnit.test("Download options assignement", function () {
   				// Create a dummy feature
				var feature = {
					properties: {
						"links" : [{
								"@href" : "http://dummy",
								"@rel" : "self",
								"@title" : "Reference link",
								"@type" : "application/atom+xml"
							}, {
								"@href" : "https://webs1.no-ip.biz/ngeo/catalogue/ENVISAT_ATS_TOA_1P/description",
								"@rel" : "search",
								"@title" : "OpenSearch Description link",
								"@type" : "application/opensearchdescription+xml"
							}, {
								"@href" : "http://eoliserv.eo.esa.int/browse/AATSR/ATS_TOA_1P/ENVISAT_1/20120318T193236500-20120318T201800770_A_T-AA0B.jpg",
								"@rel" : "enclosure",
								"@title" : "20120318T193236500-20120318T201800770_A_T-AA0B",
								"@type" : "application/x-binary",
								"@length" : 1
							}
						]
					}
				};
				
				var fc = new FeatureCollection();

				fc.features.push( feature );
				fc.select( feature );
				
				fc.updateProductUrls({
					downloadMode: "OnCompletion"
				});
				
				var productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
				//QUnit.equal( feature.properties.EarthObservation.EarthObservationResult.eop_ProductInformation.eop_filename, "http://dummy?downloadMode=OnCompletion" );
				//TODO : si le product url contient déjà un ? . C'est bizarre car on dans la réponse du nouveau format json, on a déjà un ?
				QUnit.equal( productUrl, "http://dummy?ngEO_DO={downloadMode:OnCompletion}" );
				
				fc.updateProductUrls({
					downloadMode: "Continously"
				});
				
				productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
				QUnit.equal( productUrl, "http://dummy?ngEO_DO={downloadMode:Continously}" );
		
				fc.updateProductUrls({
					downloadMode: "Continously",
					type: "PNG"
				});
				
				productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
				QUnit.equal( productUrl, "http://dummy?ngEO_DO={downloadMode:Continously,type:PNG}" );
		
				fc.updateProductUrls({
					downloadMode: "Continously",
					type: "JPEG"
				});
				
				productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
				QUnit.equal( productUrl, "http://dummy?ngEO_DO={downloadMode:Continously,type:JPEG}" );
				
				fc.unselect( feature );
				fc.features = [];
		});		
});