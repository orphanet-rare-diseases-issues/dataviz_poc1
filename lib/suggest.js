var timeout = null; // init the input timer
var previousSearch = ""; //

// Handle the main search and fills the intermediate result display (referred to as "suggest")

// Initiate suggest after user input, with delay
document.getElementById("mainInput").addEventListener('keyup', function (e) {
    // Clear the timeout if it has already been set.
    // This will prevent the previous task from executing
    // if it has been less than <MILLISECONDS>
    clearTimeout(timeout);
    // Make a new timeout set to go off in 1000ms (1 second)
    timeout = setTimeout(function () {
        var input = $("#mainInput").val().trim();
        if (input != previousSearch) {
          suggest($("#mainInputLang").val(), $("#mainInputType").val(), input);
  //        capture non-changing event
          previousSearch = input;
        } else {
          console.log("the term has already been searched");
        }
    }, suggestDelay);
});

function detectInputType(inputValue) {
  var inputType = ""
  if (!isNaN(inputValue)) {
    console.log("Code", inputValue);
    inputType = "code";
  } else {
    console.log("Term", inputValue);
    inputType = "term";
  }
  return inputType
}

// Must reject or return 1 or a list of object with at least "Preferred Terms" and "ORPHAcode" properties
function suggest(inputLang, inputType, inputValue) {
  if (inputValue == "") {
    table.clearData();
    return;
  };
//  console.log("inputLang", inputLang);
  if (inputType == "auto") {
    inputTypeFormat = detectInputType(inputValue);
    if (inputTypeFormat == "code") {
      responseORPHA = queryByOrpha(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      responseOMIM = queryByOMIM(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      response = Promise.all([responseORPHA, responseOMIM]);
    } else {
      responseLabels = queryByApproxTermAndSynonym(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      responseICD10 = queryByICD10(baseUrl, inputLang, inputValue)
      .catch((error) => {
        return null;
      });
      response = Promise.all([responseLabels, responseICD10]);
    }
  } else if (inputType == "PTS") {
    response = queryByApproxTermAndSynonym(baseUrl, inputLang, inputValue);
  } else if (inputType == "PT") {
    response = queryByApproxTerm(baseUrl, inputLang, inputValue);
  } else if (inputType == "S") {
    response = queryByApproxSynonym(baseUrl, inputLang, inputValue);
  } else if (inputType == "ORPHA") {
    response = queryByOrpha(baseUrl, inputLang, inputValue);
  } else if (inputType == "ICD-10") {
//  Test with Q61.1 and Q98.8
    response = queryByICD10(baseUrl, inputLang, inputValue);
  } else if (inputType == "OMIM") {
//  Test with 125500 and 154700
    response = queryByOMIM(baseUrl, inputLang, inputValue);
  }
// Convert to array if a single object has been found and filter null elements
  response.then(function(response) {
    return new Promise(function(resolve, reject) {
//      console.log(response);
//      if not response reject
      if (!response) {
        reject(null);
//      if response is a single object
      } else if (!Array.isArray(response)) {
        response = [response,];
        resolve(response);
//      if response is an array it can contains nested arrays AND OR null elements
      } else {
        var flatResponse = Array();
        var needFlattening = false;
        for (elem of response) {
          if (Array.isArray(elem)) {
            flatResponse.push(...elem);
            needFlattening = true;
          }
        }
        if (needFlattening) {
          response = flatResponse;
        }
//      filter null elements
        response = response.filter(x => x);
//        console.log(response);
        resolve(response);
      }
    });
  })
//  Show result list
  .then((response) => {
    if (response) {
      table.setData(response);
      lazyLoadSuggest(table.getData(), 0, paginationSize);
    } else {
      table.clearData();
    }
  })
  .catch((error) => {
    table.clearData();
  })
}

function lazyLoadSuggest(data, firstElem, lastElem) {
  if (data) {
    var inputLang = $("#mainInputLang").val();
//    console.log(data.slice(firstElem, lastElem));
    for (row of data.slice(firstElem, lastElem)) {
      if (!row["ORPHAcodeAggregation"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], ORPHAcodeAggregation:"Loading..."}]);
        aggregation = queryAggregation(baseUrl, inputLang, row.ORPHAcode);
        aggregation.then((aggregation) => {
//          console.log(aggregation);
          table.updateData([{ORPHAcode:aggregation.ORPHAcode, ORPHAcodeAggregation:aggregation.ORPHAcodeAggregation}]);
        })
      }
      if (!row["Synonym"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], Synonym:"Loading..."}]);
        synonym = querySynonymByORPHAcode(baseUrl, inputLang, row.ORPHAcode);
        synonym.then((synonym) => {
//          console.log(synonym);
          if (!synonym.Synonym) {
            synonym.Synonym = "None";
          } else {
            synonym.Synonym = synonym.Synonym.join("\n");
          }
          table.updateData([{ORPHAcode:synonym.ORPHAcode, Synonym:synonym.Synonym}]);
        })
        .then(() => {
          table.redraw();
        })
      }
      if (!row["Classification level"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], Typology:"Loading..."}]);
        classificationLevel = queryClassificationLevel(baseUrl, inputLang, row.ORPHAcode);
        classificationLevel.then((classificationLevel) => {
//          console.log(classificationLevel);
          table.updateData([{ORPHAcode:classificationLevel.ORPHAcode,
                             "Classification level":classificationLevel["ClassificationLevel"]}]);
        })
      }
// WARNING status is a reserved keyword
      if (!row["Status"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], Status:"Loading..."}]);
        disorderStatus = queryStatus(baseUrl, inputLang, row.ORPHAcode);
        disorderStatus.then((disorderStatus) => {
//          console.log(disorderStatus);
          table.updateData([{ORPHAcode:disorderStatus.ORPHAcode, Status:disorderStatus.Status}]);
        })
      }
      if (!row["Code OMIM"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], "Code OMIM":"Loading..."}]);
        disorderOMIM = queryOMIMByORPHAcode(baseUrl, inputLang, row.ORPHAcode)
        .then((disorderOMIM) => {
//          console.log(disorderOMIM);
          var OMIMList = Array();
          for (code of disorderOMIM.References) {
            OMIMList.push(code["Code OMIM"]);
          }
          OMIMList = (OMIMList).join("\n");
//          console.log(OMIMList);
          table.updateData([{ORPHAcode:disorderOMIM.ORPHAcode, "Code OMIM":OMIMList}]);
        })
        .then(() => {
          table.redraw();
        })
        .catch((error) => {
//          console.log("lazyload", error.message)
          table.updateData([{ORPHAcode:error.message, "Code OMIM":"None"}]);
        })
      }
      if (!row["Code ICD10"]) {
        table.updateData([{ORPHAcode:row["ORPHAcode"], "Code ICD10":"Loading..."}]);
        disorderICD10 = queryICD10ByORPHAcode(baseUrl, inputLang, row.ORPHAcode)
        .then((disorderICD10) => {
//          console.log(disorderICD10);
          var ICD10List = Array();
          for (code of disorderICD10.References) {
            ICD10List.push(code["Code ICD10"]);
          }
          ICD10List = (ICD10List).join("\n");
//          console.log(ICD10List);
          table.updateData([{ORPHAcode:disorderICD10.ORPHAcode, "Code ICD10":ICD10List}]);
        })
        .then(() => {
          table.redraw();
        })
        .catch((error) => {
//          console.log("lazyload", error.message)
          table.updateData([{ORPHAcode:error.message, "Code ICD10":"None"}]);
        })
      }
    }
  }
}

// Auto load test data
document.onload = suggest($("#mainInputLang").val(), $("#mainInputType").val(), $("#mainInput").val())