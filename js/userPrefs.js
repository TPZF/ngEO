define( ['jquery', 'backbone'], function($, Backbone) {

	/** Singleton Model for storing and retrieving user preferences */
	
	/** Each plain object that will be stored in the local storage 
	 * by the current user, will have its key prefixxed by the user id
	 * In order to allow many users save their prefs in the same "machine/browser"
	 */ 
	var UserPrefs = {
		//count for the same added object
		//count : 0, 
			
		/** user id to be retrieved...TODO be compliant with UM-SSO credentials*/	
		//userId : "userId",
	
		//to avoid overwriting items in the local storage and conflicts with other applications*/
		preffix : 'ngeo_',
		
		data : {datasetIds: [], datasets : [] , layerIds : [], layers : []},
		
		load : function(){
			
			if (localStorage){				
				
				//load the datsets ids
				this.data.datasetIds = JSON.parse(localStorage.getItem[this.preffix + '_' + 'datasetIds'] );
				//load each dataset object
				_.each(this.data.datasetIds, function(value, key) {
					this.data.datasets[value] = localStorage.getItem[this.preffix + '_' + value] });
				});
				//load the layerIds
				this.data.layerIds = JSON.parse(localStorage.getItem[this.preffix + '_' + 'layerIds'] );
				
				//load each layer object
				_.each(this.data.layerIds, function(value, key) {
					this.data.layers[value] = localStorage.getItem[this.preffix + '_' + value] });
				});
				
				this.trigger("localStorageLoaded")
			
			}else{
				this.trigger("localStorageException");
			}
		},
		
		/** Save the preferences object passed to the local storage 
		 *  EM Use for features later ?*/
		saveDataset : function (key, object){
			
			if (localStorage && _.isObject(object) && !_.isArray(object) && !_.isFunction(object)){
				
				localStorage.setItem(this.preffix + '_' + key, JSON.stringify(object));
				this.data.datasets[key] = object;
				this.data.datasetIds.push({'datasetId' : key});
				
			}else{	
				this.trigger("UnAllowedStorageException", object);		
			}
		},
		
		/** Save the preferences object passed to the local storage */ 
		saveLayer : function (key, object){
			
			if (localStorage && _.isObject(object) && !_.isArray(object) && !_.isFunction(object)){
				
				localStorage.setItem(this.preffix + '_' + key, JSON.stringify(object));
				this.data.layers[key] = object;
				this.data.layerIds.push({'layerId' : key});
				
			}else{	
				this.trigger("UnAllowedStorageException", object);		
			}
		},
		
		
//		/** store the dataset id in the UserPrefs loaded models and in the local storage*/ 
//		saveDataset : function (datasetId){
//			
//			if (localStorage && _.isString(datasetId)){
//				
//				this.data.datasets.push({"datasetId" : localStorage.getItem[this.preffix + '_' + 'datasetId'] });
//				localStorage.setItem(this.preffix + '_' + datasetId, datasetId);
//				
//			}else{	
//				this.trigger("UnAllowedStorageException", object);		
//			}
//		},
//		
		
		reset : function(){
			//remove stored datasets
			_.each(this.data.datasetIds, function(value, key) {
				localStorage.removeItem(this.preffix + '_' + value);
			});
			
			localStorage.removeItem(this.preffix + '_' + 'datasetIds');
			
			//remove stored layers
			_.each(this.data.layerIds, function(value, key) {
				localStorage.removeItem(this.preffix + '_' + value);
			});
			
			localStorage.removeItem(this.preffix + '_' + 'layerIds');
			
			this.data.datasets = [];
			this.data.layers = [];
			
			this.data.datasetIds = [];
			this.data.layerIds = [];

		}
	};
	
	//add events method to object
	_.extend(UserPrefs, Backbone.Events);
	
	return UserPrefs;
	
});
	