// Communication with RDcode API

// Preferred term by orphacode
function queryByOrpha(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/Name";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query by Approximate Preferred term
function queryByApproxTerm(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/ApproximateName/" + inputValue;
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query by Approximate Synonym
function queryByApproxSynonym(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/ApproximateName/" + inputValue + "/Synonym";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query by OMIM
function queryByOMIM(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/FindbyOMIM/" + inputValue;
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response["References"]);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query by ICD-10
function queryByICD10(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/ICD10/" + inputValue;
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
//      console.log(response);
      resolve(response["References"]);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query OMIM by ORPHAcode
function queryOMIMByORPHAcode(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/OMIM";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query ICD-10 by ORPHAcode
function queryICD10ByORPHAcode(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/ICD10";
  //  console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query Synonym by ORPHAcode
function querySynonymByORPHAcode(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/Synonym";
  //  console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Theses query return identical content so we can combine them here
// Query by Approximate Preferred term AND Synonym
function queryByApproxTermAndSynonym(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
//    Return null in case of error (mostly 404) to enable the "Promise.all" to continue if one of the query fails
    responseTerm = queryByApproxTerm(baseUrl, inputLang, inputValue)
    .catch((error) => {
      return null;
    })
//    Return null in case of error (mostly 404) to enable the "Promise.all" to continue if one of the query fails
    responseSyn = queryByApproxSynonym(baseUrl, inputLang, inputValue)
    .catch((error) => {
      return null;
    })
    response = Promise.all([responseTerm, responseSyn]);
    // Append all elements of Synonym response to Term response and remove duplicates
    // Term response elements are supposedly of greater relevance
//    console.log("response", response);
    response.then((response) => {
//      console.log("response", response);

//    both query matches, check for duplicate, filter the synonym response and merge
      if (response[0] && response[1]) {
        var duplicateIndex = [];
        for ([synIndex, syn] of response[1].entries()) {
          for (term of response[0]) {
            if (syn["ORPHAcode"] === term["ORPHAcode"]) {
//              console.log(syn, term);
              duplicateIndex.push(synIndex);
              break;
            }
          }
        }
        for (index of duplicateIndex.reverse()) {
          response[1].splice(index, 1);
        }
//        console.log("duplicateIndex", duplicateIndex);
//        console.log("response", response);
        var full_response = response[0];
        full_response.push(...response[1]);
//        console.log("full_response", full_response);
        resolve(full_response);

//    only 1 query match, return it
      } else if (response[0]) {
        resolve(response[0]);
      } else if (response[1]) {
        resolve(response[1]);
//    No query match, reject
      } else {
        reject();
      };
    });
  });
};

// Query the Classification level
function queryClassificationLevel(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/ClassificationLevel";
  //  console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    // must return a minimal response object in case of failure
    .catch((error) => {
      resolve({"ORPHAcode": inputValue, "ClassificationLevel":"None"});
    });
  });
};

// Query the Typology
function queryTypology(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/Typology";
  //  console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query the Status
function queryStatus(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/Status";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query the Aggregation code
// Need to add the queried ORPHAcode
function queryAggregation(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/" + inputValue + "/ORPHAcodeAggregation";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      response["ORPHAcode"] = inputValue;
//      console.log(response);
      resolve(response);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query for the classification to which an ORPHAcode belongs
function queryWhichClassif(baseUrl, inputLang, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/ClinicalEntity/orphacode/"+ inputValue + "/Classification";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      console.log("Failed to fetch classification for the node id:", inputValue);
      resolve(null);
    });
  });
};

// Query the parent of a disorder
function queryParent(baseUrl, inputLang, hchid, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/Classification/" + hchid + "/orphacode/" + inputValue + "/Parent";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response.Parent);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Query the child of a disorder
function queryChild(baseUrl, inputLang, hchid, inputValue) {
  return new Promise((resolve, reject) => {
    url = baseUrl + inputLang + "/Classification/" + hchid + "/orphacode/" + inputValue + "/Child";
//    console.log(url);
    response = willQuery(url)
    .then((response) => {
      resolve(response.Child);
    })
    .catch((error) => {
      reject(new Error(inputValue));
    });
  });
};

// Promise to send a query to the specified url
function willQuery(url) {
  return new Promise((resolve, reject) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("accept", "application/json");
    xhttp.setRequestHeader("apiKey", "rdcodeDataViz");
    xhttp.send();

    xhttp.onerror = function () {
      reject("error on xhttp");
    };

    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        response = this.responseText;
        response = JSON.parse(response);
        resolve(response);
      } else if (this.readyState == 4 && this.status == 404) {
        reject("404 on xhttp");
      }
    };
  });
};