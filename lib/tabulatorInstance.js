var table = new Tabulator("#suggestDisplay", {
    data:[],         //load row data from array
    index:"ORPHAcode",
    layout:"fitDataFill",     //fit columns to data
    responsiveLayout:"hide",  //hide columns that dont fit on the table
    tooltips:false,            //show tool tips on cells
    history:false,            //allow undo and redo actions on the table
    pagination:"local",       //'local': load all the data set provided then paginate the data
    paginationSize:paginationSize,         //allow 7 rows per page of data
    movableColumns:true,      //allow column order to be changed
    resizableColumns:"header",//resize from header only
    resizableRows:false,      //row height
    selectable:1,             //maximum 1 selectable row
    headerSort:false,
    headerSortTristate:false,
    rowSelected:function(row){
        visualisationModules($("#mainInputLang").val(), row.getData());
    },
    pageLoaded:function(pageno){
    //pageno - the number of the loaded page
        var firstElem = (pageno - 1) * paginationSize;
        var lastElem = pageno * paginationSize;
        var data = this.getData();
        if (data.length > 0) {
//          console.log(data.slice(firstElem, lastElem));
          lazyLoadSuggest(data, firstElem, lastElem);
        }
    },

//code ORPHA, main label +/- synonyme, Classification Level (group of disorders, disorders, subtype),
//Statuts (Inactive, active), Aggregation code (highlighted)
    columns:[                 //define the table columns
        {title:"Label", field:"Preferred term"},
        {title:"Synonym", field:"Synonym", formatter:"textarea", width:180},
        {title:"ORPHAcode", field:"ORPHAcode"},
        {title:"Classification level", field:"Classification level", minWidth:181},
        {title:"ICD-10", field:"Code ICD10", formatter:"textarea", width:80},
        {title:"OMIM", field:"Code OMIM", formatter:"textarea", width:80},
        {title:"Status", field:"Status", minWidth:158},
        {title:"Aggregation code", field:"ORPHAcodeAggregation", cssClass:"ORPHAcodeAggregation"},
    ],
});