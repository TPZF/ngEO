var Configuration = require('configuration');
var AdvancedSearchView = require('search/view/advancedSearchView');
var DownloadOptionsView = require('search/view/downloadOptionsView');
var OpenSearchURLView = require('search/view/openSearchURLView');
var datasetSearchContent_template = require('search/template/datasetSearchContent_template');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DataSetSearch = require('search/model/datasetSearch');

/**
 * Dataset view containing the options related to selected dataset:
 *      Advanced options, Download options and opensearch url
 *
 * The model is a dataset
 */
var DatasetView = Backbone.View.extend({

    initialize: function(options) {
        this.dataset = options.dataset;
    },

    refresh: function() {
        this.advancedCriteriaView.render();
        this.downloadOptionsView.render();
        this.$el.trigger("create");
    },

    /**
     *  Appends ATOM url button to HTML header (after jqm transformation)
     */
    appendAtomUrl: function() {
        var self = this;
        var osAtomUrlBtn = '<div title="Atom feed" class="osAtomUrl"><div class="tb-icon"></div></div>';
        // Append Open Search Atom url invoker to accordion's header
        $(osAtomUrlBtn).appendTo(this.$el.find('.ui-collapsible-heading > a > span'))
            .click(function(event) {
                event.stopPropagation();
                // Generate link on fly since the DownloadOptions is not (yet) a backbone model
                var atomUrl = DataSetSearch.getOpenSearchURL({
                    id: self.dataset.get("datasetId"),
                    format: "atom"
                });
                window.open(atomUrl);
            });
    },

    /**
     *  Render
     */
    render: function() {

        var content = datasetSearchContent_template({
            dataset: this.dataset,
            name: DataSetPopulation.getFriendlyName(this.dataset.get("datasetId"))
        });
        this.$el.append(content);

        this.advancedCriteriaView = new AdvancedSearchView({
            el: this.$el.find("#searchCriteria"),
            model: this.model,
            dataset: this.dataset
        });
        this.advancedCriteriaView.render();

        // Add download options view as a tab
        this.downloadOptionsView = new DownloadOptionsView({
            el: this.$el.find("#downloadOptions"),
            model: this.model.get("downloadOptions")[this.dataset.get("datasetId")]
        });
        this.downloadOptionsView.render();

        // OpenSearch URL view
        // this.openSearchURLView = new OpenSearchURLView({
        //     el: this.$el.find("#osUrl"),
        //     model: this.model
        // });
        // this.openSearchURLView.render();

        this.$el.trigger("create");

        // Since the html has been created, append atom feed button to header
        this.appendAtomUrl();

        // Update help labels
        this.$el
            .find("#sc-advanced-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.advancedOptions).end()
            .find("#sc-do-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.downloadOptions).end();
            //.find("#osUrl h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.openSearch);
    },

    /**
     *  Remove current view
     */
    remove: function() {
        this.advancedCriteriaView.remove();
        this.downloadOptionsView.remove();
        // this.openSearchURLView.remove();
        Backbone.View.prototype.remove.apply(this);
    }

});

module.exports = DatasetView;