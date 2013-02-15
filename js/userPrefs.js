define( ['jquery', 'backbone', 'logger', 'configuration'], function($, Backbone, Logger, Configuration) {

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
		
		//get the keys, use to display the stored preferences in the view
		keys : Configuration.localConfig.userPrefs.keys,
		
		/** get the string related to the given key */
		get : function(key){
			
			if (localStorage){				
				return localStorage.getItem(this.preffix + key);	
			} else {
				//notify the user if the browser does not support local storage
				Logger.warning('Your browser does not support HTML5 local storage.The preferences cannot be stored.');
			}
		},
		
		/** Save the preferences key, value passed to the local storage */ 
		save : function (key, value){
			
			if (localStorage && _.isString(value) && !_.isArray(value) && !_.isFunction(value)){
				
				var oldValue = localStorage.setItem(this.preffix + key, value);
				localStorage.setItem(this.preffix + key, value);
				
				if (this.keys.indexOf(key) == -1){
					this.keys.push(key);
					this.trigger('addedPreference');
				}
				
				if (oldValue != value){
					this.trigger('addedPreference');
				}
			}else{	
				this.trigger("UnAllowedStorageException", key);		
			}
		},
		
		/** Save the preferences object passed to the local storage */
		saveObject : function (key, object){
			
			if (_.isObject(localStorage) && _.isObject(object) && !_.isArray(object) && !_.isFunction(object)){
				
				var oldValue = localStorage.setItem(this.preffix + key);
				localStorage.setItem(this.preffix + key, JSON.stringify(object));
				
				if (this.keys.indexOf(key) == -1){
					this.keys.push(key);
					this.trigger('addedPreference');
				}

				if (oldValue != JSON.stringify(object)){
					this.trigger('addedPreference');
				}
				
			}else{	
				this.trigger("UnAllowedStorageException", object);		
			}
		},
			
		/** removed stored keys */ 
		reset : function(){
			var self = this;
			//remove stored keys
			_.each(this.keys, function(key) {
				var itemName = self.preffix  + key;
				localStorage.removeItem(itemName);
				self.trigger('removedPreference', key);
			});
			
			this.keys =  Configuration.localConfig.userPrefs.keys;
			
			//this.trigger('resetPreferences');
		}
	};
	
	//add events method to object
	_.extend(UserPrefs, Backbone.Events);
	
	return UserPrefs;
	
});
	