'use strict';

/* Directives */
angular.module('cttvDirectives', [])



    /**
     * Matrix (heatmap) view for target associations
     */
    .directive('cttvTargetAssociationsTable', ['$log', 'cttvAPIservice', 'clearUnderscoresFilter', 'upperCaseFirstFilter', 'cttvUtils', '$compile', function ($log, cttvAPIservice, clearUnderscores, upperCaseFirst, cttvUtils, $compile) {

        var hasDatatype = function (myDatatype, datatypes) {
            for (var i=0; i<datatypes.length; i++) {
                var datatype = upperCaseFirst(clearUnderscores(datatypes[i]));
                if (datatype.trim() === myDatatype.trim()) {
                    return true;
                }
            }
            return false;
        }


        var cols = [
            "Disease",
            "EFO",
            "Association score",
            "Genetic association",
            "Somatic mutation",
            "Known drug",
            "Rna expression",
            "Affected pathway",
            "Animal model",
            "Therapeutic area"
        ];


        /*
         Setup the table cols and return the DT object
        */
        var setupTable = function(table, filename){
            return $(table).DataTable( cttvUtils.setTableToolsParams({
                        //"data": newData,
                        "columns": (function(){var a=[];for(var i=0; i<cols.length; i++){a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" })};return a;})(),
                        "columnDefs" : [
                            {
                            "targets" : [1],
                            "visible" : false
                            }
                        ],
                        "order" : [[2, "desc"]],
                        "autoWidth": false,
                        "ordering": true,
                        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                        "pageLength": 50
                    }, filename ));
        }


        return {

            restrict: 'E',


            scope: {
                    loadprogress : '=',
                    filename : '@',
                    datatypes : '@'
            },


            template: '<table class="table matrix-table"></table>'
                     +'<cttv-matrix-table-legend labels="labs" legend-text="legendText" colors="colors"></cctv-matrix-table-legend>',


            link: function (scope, elem, attrs) {


                var colorScale = d3.scale.linear()
                                    .domain([0,Number.MIN_VALUE,1])
                                    //.range(["#AAAAAA","#e9f3f8", "#2383BA"]); // blue orig
                                    //.range(["#DDDDDD","#FFFF00", "#fc4e2a"]); // amber-red
                                    //.range(["#DDDDDD","#5CE62E", "#40A120"]);    // green
                                    //.range(["#EEEEEE","#a6bddb", "#045a8d"]);
                                    .range(["#EEEEEE","#eff3ff","#2171b5"])

                /*
                 * Generates and returns the string representation of the span element
                 * with color information for each cell
                 */
                var getColorStyleString = function(value){
                    return "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
                }


                /*
                 * Fetch new data and update the table content
                 * without destroying and recreating the table
                 */
                var updateTable = function (table, datatypes) {

                    scope.loadprogress = true;

                    var dts = JSON.parse(attrs.datatypes);
                    var opts = {
                        gene: attrs.target,
                        datastructure: "flat",
                        expandefo: false
                    };



                    if (!_.isEmpty(dts)) {
                        opts.filterbydatatype = _.keys(dts);
                    }

                    return cttvAPIservice.getAssociations (opts)
                        .then(function (resp) {
                            //resp = JSON.parse(resp.text);
                            scope.loadprogress = false;
                            resp = resp.body;
                            $log.log("RESP FOR TABLES (IN DIRECTIVE): ");
                            $log.log(resp);
                            var newData = [];
                            for (var i=0; i<resp.data.length; i++) {
                                var data = resp.data[i];
                                if (data.efo_code === "cttv_disease") {
                                    continue;
                                }
                                var datatypes = {};
                                datatypes.genetic_association = _.result(_.find(data.datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
                                datatypes.somatic_mutation = _.result(_.find(data.datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
                                datatypes.known_drug = _.result(_.find(data.datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
                                datatypes.rna_expression = _.result(_.find(data.datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
                                datatypes.affected_pathway = _.result(_.find(data.datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
                                datatypes.animal_model = _.result(_.find(data.datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
                                var row = [];
                                // Disease name
                                var geneDiseaseLoc = "#/evidence/" + attrs.target + "/" + data.efo_code;
                                row.push("<a href=" + geneDiseaseLoc + ">" + data.label + "</a>");
                                // EFO (hidden)
                                row.push(data.efo_code);

                                // Association score
                                row.push( getColorStyleString( data.association_score ) );
                                // Genetic association
                                row.push( getColorStyleString( datatypes.genetic_association));
                                // Somatic mutation
                                row.push( getColorStyleString( datatypes.somatic_mutation) );
                                // Known drug
                                row.push( getColorStyleString( datatypes.known_drug) );
                                // Expression atlas
                                row.push( getColorStyleString( datatypes.rna_expression) );
                                // Affected pathway
                                row.push( getColorStyleString( datatypes.affected_pathway) );
                                // Animal model
                                row.push( getColorStyleString( datatypes.animal_model) );
                                // Therapeutic area
                                row.push(data.therapeutic_area || "");

                                newData.push(row);
                            }

                            // clear any existing data from the table
                            // and add the new data
                            table.clear().rows.add(newData).draw();

                        });

                };    // end updateTable



                // -----------------------
                // Initialize table etc
                // -----------------------

                // table itself
                var table = elem.children().eq(0)[0];
                var dtable = setupTable(table, scope.filename);

                // legend stuff
                scope.labs = [0,1];
		scope.legendText = "Score";
                scope.colors = [];
                for(var i=0; i<=10; i+=2){
                    var j=i/10;
                    //scope.labs.push(j);
                    scope.colors.push( colorScale(j) );
                }



                // TODO: This is firing a second time the table creation. Make sure only one table is created at a time
                /*
                 * Watch for changes in the datatypes.
                 * This is fired also at initization:
                 * no need to watch for changes to target,
                 * so we only have one call (might need to check in the future though).
                 * We're also no longer removing/destroying the table
                 * which is only created at initialization, again removing the need
                 * to watch out for double created tables...
                 */
                scope.$watch( function () { return attrs.datatypes }, function (dts) {
                    dts = JSON.parse(dts);

                    updateTable(dtable, dts)
                    .then(function () {
                        dtable.columns().eq(0).each (function (i) {

                            // first headers are "Disease", "EFO", "Association score" and last one is "Therapeutic area"
                            if (i>2 && i<9) {
                                var column = dtable.column(i);
                                if (hasDatatype(column.header().innerText, _.keys(dts))) {
                                    column.visible(true);
                                } else {
                                    column.visible(false);
                                }
                            }

                        });
                    });

                    // Hide the columns that are filtered out
                });

            } // end link

        }; // end return

    }])    // end directive cttvTargetAssociationsTable



    /*
     *
     */
    .directive('cttvTargetAssociationsTree', ['$log', 'cttvAPIservice', function ($log, cttvAPIservice) {
    var gat;
    return {
        restrict: 'E',
        scope: {},
        link: function (scope, elem, attrs) {

        var datatypesChangesCounter = 0;
        scope.$watch(function () { return attrs.datatypes }, function (dts) {
            dts = JSON.parse(dts);
            if (datatypesChangesCounter>0) {
            if (!gat) {
                setTreeView();
                return;
            }
            var opts = {
                gene: attrs.target,
                datastructure: "tree",
            };
            if (!_.isEmpty(dts)) {
                opts.filterbydatatype = _.keys(dts);
            }
            cttvAPIservice.getAssociations (opts)
                .then (function (resp) {
                var data = resp.body.data;
                if (data) {
                    gat
			.data(data)
			.datatypes(dts)
			.update();
                }
                });
            }
            datatypesChangesCounter++;
        });

        var setTreeView = function () {
            ////// Tree view
            // viewport Size
            var viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            var viewportH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

            // Element Coord
            var elemOffsetTop = elem[0].parentNode.offsetTop;

            // BottomMargin
            var bottomMargin = 50;

            // TODO: This is not being used at the moment. We are fixing the size of the tree to 900px (see below)
            var diameter = viewportH - elemOffsetTop - bottomMargin;
            $log.log("DIAMETER FOR TREE: " + diameter);

            var dts = JSON.parse(attrs.datatypes);
            var opts = {
            gene: attrs.target,
            datastructure: "tree"
            }
            if (!_.isEmpty(dts)) {
            opts.filterbydatatype = _.keys(dts)
            }
            cttvAPIservice.getAssociations (opts)
            .then (function (resp) {
                var data = resp.body.data;
                if (_.isEmpty(data)) {
                return;
                }
                var fView = flowerView()
                .fontsize(9)
                .diagonal(100);

                gat = geneAssociationsTree()
                    .data(data)
                    .datatypes(dts)
                    .diameter(900)
		    .legendText("<a xlink:href='#/faq#association-score'><text style=\"fill:#3a99d7;cursor:pointer\" alignment-baseline=central>Score</text></a> <text alignment-baseline=central x=40>range</text>")
                    .target(attrs.target);
                gat(fView, elem[0]);
            });
        };

        scope.$watch(function () { return attrs.target }, function (val) {
            setTreeView();
        });
        }
    }
    }])



    /**
     *
     * Options for configuration are:
     *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
     *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
     *
     * Example:
     *   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
     *
     *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
     *   This is useful in conjunction with a spinner where you can have ng-show="loading"
     */
    .directive('cttvDiseaseAssociations', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {

        var colorScale = d3.scale.linear()
                        .domain([0,1])
                        //.range(["#e9f3f8", "#2383BA"]);
                        .range(["#eff3ff","#2171b5"])

        var getColorStyleString = function(value){
            return "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
        }

        var cols = [
            "",
            "Ensembl ID",
            "Association score",
            "Genetic association",
            "Somatic mutations",
            "Known drugs",
            "RNA expression",
            "Affected pathways",
            "Animal models",
            ""
        ];

        return {

            restrict: 'E',

            scope: {
                loadprogress : '=',
                filename : '@'
            },

            template: '<table class="table matrix-table"></table>'
                     +'<cttv-matrix-table-legend labels="labs" legend-text="legendText" colors="colors"></cctv-matrix-table-legend>',

            link: function (scope, elem, attrs) {

                // set the load progress flag to true before starting the API call
                scope.loadprogress = true;

                cttvAPIservice.getAssociations ({
                    efo: attrs.target
                })
                    .then(function (resp) {

                        // set hte load progress flag to false once we get the results
                        scope.loadprogress = false;

                        scope.$parent.nresults = resp.body.total;


                        var data = resp.body.data;
                        var newData = new Array(data.length);

                        for (var i=0; i<data.length; i++) {
                            var datatypes = {};
                            datatypes.genetic_association = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "genetic_association" }), "association_score")||0;
                            datatypes.somatic_mutation = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "somatic_mutation" }), "association_score")||0;
                            datatypes.known_drug = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "known_drug" }), "association_score")||0;
                            datatypes.rna_expression = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "rna_expression" }), "association_score")||0;
                            datatypes.affected_pathway = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "affected_pathway" }), "association_score")||0;
                            datatypes.animal_model = _.result(_.find(data[i].datatypes, function (d) { return d.datatype === "animal_model" }), "association_score")||0;
                            var row = [];
                            var geneLoc = "";
                            var geneDiseaseLoc = "#/evidence/" + data[i].gene_id + "/" + attrs.target;
                            row.push("<a href=" + geneDiseaseLoc + ">" + data[i].label + "</a>");
                            // Ensembl ID
                            row.push(data[i].gene_id);
                            // The association score
                            row.push( getColorStyleString(data[i].association_score) );
                            // Genetic Association
                            row.push( getColorStyleString(datatypes.genetic_association) );
                            // Somatic Mutations
                            row.push( getColorStyleString(datatypes.somatic_mutation) );
                            // Known Drugs
                            row.push( getColorStyleString(datatypes.known_drug) );
                            // RNA expression
                            row.push( getColorStyleString(datatypes.rna_expression) );
                            // Affected pathways
                            row.push( getColorStyleString(datatypes.affected_pathway) );
                            // Animal models
                            row.push( getColorStyleString(datatypes.animal_model) );

                            // We will insert the flower here
                            //row.push("");

                            // Push gene name again instead
                            row.push("<a href=" + geneDiseaseLoc + ">" + data[i].label + "</a>");

                            newData[i] = row;

                        }



                        // -----------------------
                        // Initialize table etc
                        // -----------------------

                        // table itself
                        var table = elem.children().eq(0)[0];
                        var dtable = $(table).dataTable(cttvUtils.setTableToolsParams({
                            "data" : newData,
                            "columns": (function(){var a=[];for(var i=0; i<cols.length; i++){a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" })};return a;})(),
                            "columnDefs" : [
                                {
                                    "targets" : [1],
                                    "visible" : false
                                }
                            ],
                            "order" : [[2, "desc"]],
                            "autoWidth": false,
                            "ordering": true,
                            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                            "pageLength": 50
                        }, scope.filename ));


                        // legend stuff
                        scope.labs = [0,1];
			scope.legendText = "Score";
                        scope.colors = [];
                        for(var i=0; i<=10; i+=2){
                            var j=i/10;
                            //scope.labs.push(j);
                            scope.colors.push( colorScale(j) );
                        }

                    });
            } // end link
        }; // end return
    }])



    /*
     *
     */
    .directive('pmcCitationList', function () {
    var pmc = require ('biojs-vis-pmccitation');
        return {
            restrict: 'E',
            templateUrl: "partials/pmcCitation.html",
            link: function (scope, elem, attrs) {
        scope.$watch(function () { return attrs.pmids}, function (newPMIDs) {
            var pmids = newPMIDs.split(",");
            if (pmids[0]) {
            var terms = [];
            for (var i=0; i<pmids.length; i++) {
                terms.push("EXT_ID:" + pmids[i]);
            }
            var query = terms.join(" OR ");
                var config = {
                    width: 800,
                    loadingStatusImage: "",
                    source: pmc.Citation.MED_SOURCE,
                query: query,
                    target: 'pmcCitation',
                    displayStyle: pmc.CitationList.FULL_STYLE,
                    elementOrder: pmc.CitationList.TITLE_FIRST
                };
                var instance = new pmc.CitationList(config);
                instance.load();
            }
        });
            }
        };
    })



    /*
     *
     */
    .directive('pmcCitation', function () {
    return {
        restrict: 'E',
        templateUrl: "partials/pmcCitation.html",
        link: function (scope, elem, attrs) {
        var pmc = require ('biojs-vis-pmccitation');
        var config = {
            source: pmc.Citation.MED_SOURCE,
            citation_id: attrs.pmcid,
            width: 400,
            proxyUrl: 'https://cors-anywhere.herokuapp.com/',
            displayStyle: pmc.Citation.FULL_STYLE,
            elementOrder: pmc.Citation.TITLE_FIRST,
            target : 'pmcCitation',
            showAbstract : false
        };
        var instance = new pmc.Citation(config);
        instance.load();
        }
    };
    })



    /*
     *
     */
    .directive('cttvTargetGenomeBrowser', ['cttvAPIservice', function (cttvAPIservice) {
        return {
            restrict: 'E',
            link: function (scope, elem, attrs) {
            var w = elem[0].parentNode.offsetWidth - 40;
            scope.$watch(function () {return attrs.target }, function (target) {
                if (target === "") {
                return;
                }
                var newDiv = document.createElement("div");
                newDiv.id = "cttvTargetGenomeBrowser";
                elem[0].appendChild(newDiv);

                var gB = tnt.board.genome()
                .species("human")
                .gene(attrs.target)
                .context(20)
                .width(w);
                var theme = targetGenomeBrowser()
                .chr(scope.chr);
                theme(gB, cttvAPIservice.getSelf(), document.getElementById("cttvTargetGenomeBrowser"));
            });
            }
        };
    }])



    /*
     *
     */
    .directive('cttvTargetTranscripts', ['cttvAPIservice', function (cttvAPIservice) {
    return {
        restrict: 'E',
        scope : {
        },
        link: function (scope, elem, attrs) {
        var w = elem[0].parentNode.offsetWidth - 40;
        scope.$watch (function () { return attrs.target }, function (target) {
            if (target === "") {
            return;
            }
            var newDiv = document.createElement("div");
            newDiv.id = "cttvTargetTranscriptView";
            elem[0].appendChild(newDiv);

            var tV = tnt.transcript()
            .width(w)
            .gene(target);
            var tvTheme = targetTranscriptView();
            tvTheme (tV, cttvAPIservice.getSelf(), document.getElementById("cttvTargetTranscriptView"));
        });
        }
    };
    }])



    /*
     *
     */
    .directive('ebiExpressionAtlasBaselineSummary', function () {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
        scope.$watch(function () { return attrs.target }, function (target) {
            if (target === "") {
            return;
            }
            var newDiv = document.createElement("div");
            newDiv.id = "cttvExpressionAtlas";
            newDiv.className = "accordionCell";
            elem[0].appendChild(newDiv);

            var instance = new Biojs.AtlasHeatmap ({
            gxaBaseUrl: 'https://www.ebi.ac.uk/gxa',
            params:'geneQuery=' + target + "&species=homo%20sapiens",
            isMultiExperiment: true,
            target : "cttvExpressionAtlas"
            })
        });
        },
    }
    })



    /*
     *
     */
    .directive('cttvSearchSuggestions', function(){
        return {
            restrict:'EA',
            templateUrl: 'partials/search-suggestions.html',
            replace: true,
            link: function(scope, elem, attrs){

            }
        }
    })



    /**
     * Flower graph
     */
    .directive('cttvGeneDiseaseAssociation', function(){
        return {
            restrict:'EA',
            //transclude: 'true',
            scope: {
                associationData: '='
            },
            link: function(scope, elem, attrs){
                //var flower = flowerView().values(scope.associationData);
                //flower(elem[0]);

                scope.render = function(data){
                    if(data.length>0){
                        var flower = flowerView()
                    .values(data)
                    .diagonal(200)
                        flower(elem[0]);
                    }
                }

                // Watch for data changes
                scope.$watch(
                    'associationData',
                    function() {
                        scope.render(scope.associationData);
                    }//,
                    //true
                );
            }
        }
    })



    /*
     *
     */
    .directive('cttvProgressSpinner', function(){
        return {
            restrict: 'EA',
            template: '<i class="fa fa-circle-o-notch fa-spin"></i>',
            link: function(scope, elem, attrs){

                if(attrs.size){
                    elem.addClass("fa-"+attrs.size+"x");
                }
            }
        }
    })



    /*
     *
     */
    .directive('cttvMatrixTable', function(){
        return {
            restrict: 'EA',
            template: '<table class="table matrix-table"></table>',
            replace: true,
            link: function(scope, elem, attrs){

                var colorScale = d3.scale.linear()
                                    .domain([0,1])
                                    .range(["#e9f3f8", "#2383BA"]);

                var getColorStyleString = function(value){
                    return "<span style='color: "+colorScale(value)+"; background: "+colorScale(value)+";' title='Score: "+value+"'>"+value+"</span>";
                }

                elem.on('$destroy', function() {
                    // remove objects from memory as required
                });

            }
        }
    })



    /*
     *
     */
    .directive('cttvMatrixTableLegend', function(){
        var template = '<div class="matrix-table-legend matrix-table-legend-layout-h">'
                     +    '<span class="matrix-table-legend-from" ng-show="labels.length==2">{{labels[0]}}</span>'
                     +    '<span class="matrix-table-legend-item" ng-repeat="color in colors">'
                     +       '<span class="matrix-table-legend-background" style="background:{{color}};"></span>'
                     +    '</span>'
                     +    '<span class="matrix-table-legend-to" ng-show="labels.length==2">{{labels[1]}}</span>'
                     +    '<a ng-if="legendText!=undefined" href="#/faq#association-score"><span class="matrix-table-legend-text">{{legendText}}</span></a>'
                     + '</div>';

        return {
            restrict: 'EA',
            template: template,
            replace: true,
            scope: {
                labels: '=',
                colors: '=',
		legendText: '=',
            },
            link: function(scope, elem, attrs){



                elem.on('$destroy', function() {
                    // remove objects from memory as required
                });

            }
        }
    })



    /**
     *
     * Options for configuration are:
     *   filename: the string to be used as filename when exporting the directive table to excel or pdf; E.g. "targets_associated_with_BRAF"
     *   loadprogress: the name of the var in parent scope to be used as flag for API call progress update. E.g. laodprogress="loading"
     *
     * Example:
     *   <cttv-disease-associations target="{{search.query}}" filename="targets_associated_with_BRAF" loadprogress="loading"></cttv-disease-associations>
     *
     *   In this example, "loading" is the name of the var in the parent scope, pointing to $scope.loading.
     *   This is useful in conjunction with a spinner where you can have ng-show="loading"
     */
    .directive('cttvHpaTissueExpression', ['$log', 'cttvAPIservice', 'cttvUtils', function ($log, cttvAPIservice, cttvUtils) {

        var colorScale = d3.scale.linear()
                        .domain([0,3])
                        //.range(["#80bbd7", "#2383BA"]);
                        //.range(["#DDDDDD","#A3CEE2", "#2383BA"]);

                        //.range(["#FFFF00", "#FF982A"]); // amber-red
                        //.range(["#5CE62E", "#40A120"]);    // green
                        //.range(["#a6bddb", "#045a8d"]);
                        .range(["#eff3ff",/*"#bdd7e7","#6baed6",*/"#2171b5"])

        var getColorStyleString = function(value){
            var span="";

            if(value==0){
                span = "<span class='value-0' title='Not expressed'>"+value+"</span>";
            } else if(value>0){
                var c = colorScale(value);
                var l = "";
                switch (value){
                    case 1:
                        l = "low";
                        break;
                    case 2:
                        l = "medium";
                        break;
                    case 3:
                        l = "high";
                        break;
                }
                span = "<span style='color: "+c+"; background: "+c+";' title='Expression: "+l+"'>"+value+"</span>";
            } else {
                span = "<span class='no-data' title='No data'>N/A</span>"
            }


            return span;
        }

        var cols = [
            "Tissue",
            "Protein",
            "RNA",
            ""
        ];

        return {

            restrict: 'EA',

            scope: {
                target : '=',
                //loadprogress : '=',
                filename : '@'
            },

            template: '<table class="table matrix-table'+/*hpa-matrix-table+*/'"></table>' // TODO: comment class back in

                     +'<div class="matrix-table-legend matrix-table-legend-layout-v clearfix" style="margin-bottom:10px;">'

                     +'  <div class="clearfix">'
                     +'    <span class="matrix-table-legend-item">'
                     +'        <span class="matrix-table-legend-background no-data">1</span>'
                     +'    </span>'
                     +'    <span class="matrix-table-legend-to">No data</span>'
                     +'  </div>'

                     +'  <div class="clearfix">'
                     +'    <span class="matrix-table-legend-item">'
                     +'        <span class="matrix-table-legend-background value-0">2</span>'
                     +'    </span>'
                         +'    <span class="matrix-table-legend-to">Not expressed</span>'
                     +'  </div>'


                     +'</div>'

                     +'<cttv-matrix-table-legend labels="labs" colors="colors"></cctv-matrix-table-legend>',

            link: function (scope, elem, attrs) {

                // set the load progress flag to true before starting the API call
                //scope.loadprogress = true;



                // Watch for data changes
                scope.$watch(
                    'target',
                    function() {

                        // move cttvAPIservice.getExpression ({ in here
                            // ......

                        if( scope.target ){

                            cttvAPIservice.getExpression ({
                                    gene: scope.target
                                })
                                .then(

                                    // success
                                    function (resp) {

                                        // set hte load progress flag to false once we get the results
                                        //scope.loadprogress = false;

                                        //scope.$parent.nresults = resp.body.total;


                                        //var data = resp.body.data;
                                        //var newData = new Array(data.length);
                                        $log.debug(resp);

                                        //var cols = ["", "RNA", "Protein"];
                                        var data = resp.body.data[scope.target].tissues;
                                        var newData = [];

                                        for (var tissue in data) {
                                            $log.debug(tissue+":"+data[tissue]);

                                            var row = [];
                                            row.push( tissue );
                                            row.push( getColorStyleString(data[tissue].protein.level) );
                                            row.push( getColorStyleString(data[tissue].rna.level) );
                                            row.push("");
                                            newData.push(row);

                                        }

                                        // -----------------------
                                        // Initialize table etc
                                        // -----------------------

                                        // table itself
                                        var table = elem.children().eq(0)[0];
                                        var dtable = $(table).dataTable(cttvUtils.setTableToolsParams({
                                            "data" : newData,
                                            "columns": (function(){var a=[];for(var i=0; i<cols.length; i++){a.push({ "title": "<div><span title='"+cols[i]+"'>"+cols[i]+"</span></div>" })};return a;})(),
                                            "order" : [[0, "asc"]],
                                            "autoWidth": false,
                                            "ordering": true,
                                            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                                            "pageLength": 50
                                        }, scope.filename ));


                                        // legend stuff
                                        scope.labs = ["low", "high"];
                                        scope.colors = [];
                                        for(var i=1; i<=3; i++){
                                            //scope.labs.push(i);
                                            scope.colors.push( colorScale(i) );
                                        }


                                    },

                                    // error
                                    cttvAPIservice.defaultErrorHandler
                                )
                        }
                    }

                ); // end watch

            } // end link
        }; // end return
    }])
