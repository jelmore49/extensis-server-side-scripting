// Example server-side Portfolio script that moves assets from catalog "Work In Progress" to catalog "Archive"
// when the user drags assets to a gallery in "Work In Progress" called "Send To Archive". Folder structure
// is preserved.

load("nashorn:mozilla_compat.js");

function getProperties() {
  return { triggerPoints: ['onGalleryChanged'] };
}

function onGalleryChanged(catalogId, galleryId, wereItemsAdded, assetQuery, assetCount) {

  if (!wereItemsAdded) {
    return;
  }

  let catalogName = portfolio.getCatalogName(catalogId);
  if (!catalogName.equals('Work In Progress')) {
    return;
  }

  let gallery = portfolio.getGallery(catalogId, galleryId);
  if (!gallery.getName().equals('Send To Archive')) {
    return;
  }

  let destinationCatalogId = portfolio.getCatalogId('Archive');
  let queryOptions = {
    pageSize: 1000, // TODO - support more than 1000 assets via paging.
    fieldNames: [ 'Filename', 'Directory Path' ]
  };

  let queryResults = portfolio.getAssets(catalogId, assetQuery, queryOptions);
  let assets = queryResults.getAssets();
  for (let i = 0; i < assets.length; ++i) {
    let asset = assets[i];
    // Make a javascript string.
    let path = String(asset.getSingleValueForName('Directory Path'));
    // Strip off the initial part of the path that we don't care about in the assets' new home..
    let destinationPath = path.replace(/^::[^:]+:[^:]+:Users:Shared:Portfolio:In Progress Files:/, '');
    destinationPath = destinationPath.replace(/:$/, ''); // Strip off trailing colon
    portfolio.createSubfolder(destinationCatalogId, destinationPath, '0');
    // Prefix with a colon so it is a valid vault path.
    destinationPath = ':' + destinationPath;
    portfolio.copyOrMoveAsset({
      operation: 'move',
      assetId: asset.getAssetId(),
      sourceCatalogId: catalogId,
      destinationCatalogId: destinationCatalogId,
      destinationPath: destinationPath,
    });
  }
}
