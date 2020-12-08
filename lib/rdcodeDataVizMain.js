function visualisationModules(inputLang, row) {
  if (row.ORPHAcode == "") {return};
  // classification tree with box
  classificationEntry(inputLang, parseInt(row.ORPHAcode), row["Preferred term"], graphConf, completeness=2, loadedMap);
}