var SearchResultsMap = require('searchResults/map');
var Map = require('map/map');
var shopcartViewContent_template = require('shopcart/template/shopcartViewContent');
var UserPrefs = require('userPrefs');

/**
 * This view represents the status bar for shopcart dataset
 * The model of this view is Shopcart
 * This collection of this view is ShopcartCollection
 */
var ShopcartView = Backbone.View.extend({

    id: "shopcartBar",

    initialize: function() {
        // Connect shopcart with Map        
        var shopcartLayer = Map.addLayer({
            name: "Shopcart Footprints",
            type: "Feature",
            visible: true,
            style: "shopcart-footprint"
        });
        
        var self = this;
        var updateShopcartLabel = function() {
            var currentShopcart = self.collection.getCurrent();
            var numItems = currentShopcart.featureCollection.features.length;
            self.$el.find('#shopcartMessage').html( currentShopcart.get('name') + ' : ' + numItems + ' items' );
        };
        
        // Manage display of shopcart footprints
        this.collection.on('change:current', function( current, prevCurrent ) {
            if ( prevCurrent ) {
                prevCurrent.featureCollection.off('add:features', updateShopcartLabel );
                prevCurrent.featureCollection.off('remove:features', updateShopcartLabel );
                prevCurrent.off('change:name', updateShopcartLabel);
                
                SearchResultsMap.removeFeatureCollection( prevCurrent.featureCollection, { keepLayer: true } );
            }
            
            updateShopcartLabel();
            shopcartLayer.clear();
            
            SearchResultsMap.addFeatureCollection( current.featureCollection, {
                layer: shopcartLayer,
                hasBrowse: false
            });
            
            current.on('change:name', updateShopcartLabel);
            current.featureCollection.on('add:features', updateShopcartLabel );
            current.featureCollection.on('remove:features', updateShopcartLabel );

            // Change model on table when the shopcart is changed
            current.loadContent();

            // Store as user preference
            UserPrefs.save("Current shopcart", current.id);
        });
    },

    /**
     *  Render
     */
    render: function() {
        this.$el.html(shopcartViewContent_template())
                .trigger("create");
    }
});

module.exports = ShopcartView;