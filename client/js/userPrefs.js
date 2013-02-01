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
		
		data : {datasets : [] , layers : []},
		
		load : function(){
			
			if (localStorage){				
				
				this.data.datasets.push({"datasetId" : localStorage.getItem[this.preffix + '_' + 'datasetId'] });
				this.data.layers.push({"layerUrl" : localStorage.getItem[this.preffix + '_' + 'layerUrl'] });	
				
				this.trigger("localStorageLoaded")
			
			}else{
				this.trigger("localStorageException");
			}
		},
		
		/** Save the preferences object passed to the local storage 
		 *  EM Use for features later ?*/
		save : function (key, object){
			
			if (localStorage && _.isObject(object) && !_.isArray(object) && !_.isFunction(object)){
				
				localStorage.setItem(this.preffix + '_' + key, JSON.stringify(object));
				
			}else{	
				this.trigger("UnAllowedStorageException", object);		
			}
		},
		
		/** store the dataset id in the UserPrefs loaded models and in the local storage*/ 
		saveDataset : function (datasetId){
			
			if (localStorage && _.isString(datasetId)){
				
				this.data.datasets.push({"datasetId" : localStorage.getItem[this.preffix + '_' + 'datasetId'] });
				localStorage.setItem(this.preffix + '_' + datasetId, datasetId);
				
			}else{	
				this.trigger("UnAllowedStorageException", object);		
			}
		},
		
		
		reset : function(){
			//remove stored datasets
			_.each(this.data.datasets, function(value, key) {
				localStorage.removeItem(this.preffix + '_' + value);
			});
			
			//remove stored layers
			_.each(this.data.layers, function(value, key) {
				localStorage.removeItem(this.preffix + '_' + value);
			});
			
			this.data.datasets = [];
			this.data.layers = [];

		}
	};
	
	//add events method to object
	_.extend(UserPrefs, Backbone.Events);
	
	return UserPrefs;
	
});
	