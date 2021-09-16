//
// Example javascript for Portfolio custom scripting
//
// After a file has been cataloged, this script will parse the filename and add keywords.
// In this example, the filename's extension is stripped, and the resulting string is split on
// space, underscore, hyphen, or comma.
//

load("nashorn:mozilla_compat.js");

// Entry point
function getProperties() {
  return {
    triggerPoints: ['onCataloged']
  };

}

let kField_Filename = 'Filename';
let kField_Keywords = 'Keywords';

// Entry point
function onCataloged(catalogId, assetId) {
  portfolio.log('onCataloged: catalogId=' + catalogId + ', assetId=' + assetId);
  let catalogName = portfolio.getCatalogName(catalogId);
  // Only do this for catalogs with names starting with 'server-scripts-', so that we don't modify files inadvertently!
  if (catalogName.startsWith('server-scripts-')) {
    let asset = portfolio.getAssetById(catalogId, assetId);
    addKeywordsFromFilename(catalogId, assetId, asset);
  }
}

function addKeywordsFromFilename(catalogId, assetId, asset) {
  // Add keywords via parts of filename separated by underscores.
  let filename = asset.getSingleValueForName(kField_Filename);
  filename = stripOffExtension(filename);
  let keywords = filename.split(/[\s_,-]+/);
  if (keywords.length >= 2) {
    let currentKeywords = asset.getMultiValuesForName(kField_Keywords);
    let newKeywords = [];
    for (let i = 0; i < currentKeywords.length; ++i) {
      newKeywords.push(currentKeywords[i]);
    }
    for (let i = 0; i < keywords.length; ++i) {
      if (keywords[i].isEmpty()) {
        continue;
      }
      newKeywords.push(keywords[i]);
    }
    portfolio.updateAsset(catalogId, assetId, { 'Keywords': newKeywords });
  }
}

function stripOffExtension(filename) {
  let pos = filename.lastIndexOf('.');
  if (pos !== -1) {
    filename = filename.substring(0, pos);
  }
  return filename;
}
