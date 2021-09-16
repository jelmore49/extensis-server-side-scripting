load("nashorn:mozilla_compat.js");
importPackage(Packages.extensis.portfolio.server.dto);
importPackage(Packages.java.io);

function getProperties() {
  return {
    triggerPoints: [ 'onJobEachAsset', 'onJobFinalize' ],
    displayName: 'Find Duplicates',
  };
}

// Set one or both of these to true.
var USE_FILESIZE = false;
var USE_FILENAME = true;

function onJobEachAsset(data) {
  // In a job, assets are processed several at a time. Since we are operating
  // on shared data here, we need to synchronize changes to the data using
  // the built-in sync function.
  sync(function(assetId, key) {
    let dupData = portfolio.getData().get('dupData');
    if (! dupData) {
      dupData = {};
      portfolio.getData().put('dupData', dupData);
    }
    const itemData = dupData[key];
    if (!itemData) {
      dupData[key] = [ assetId ];
    } else {
      itemData.push(assetId);
    }
  })(data.itemState.assetId, makeDupKey(data.itemState));
}

function onJobFinalize(data) {
  portfolio.log('onJobFinalize called for catalog ' + data.catalogId);
  // Additional properties can be accessed here and in onJobEachAsset.
  //   data.jobProcessor.query - the AssetQuery for the items being processed
  //   data.jobProcessor.username
  //   data.jobProcessor.job - the Job object
  //   data.jobProcessor.archivePath
  //

  // Make sure to clear out the data or you get a memory leak!!!
  const dupData = portfolio.getData().remove('dupData');

  const gallery = new Gallery();
  gallery.setName('duplicates');
  gallery.setType(GalleryType.saved);
  gallery.setAccessType(GalleryAccessType.privateAccess);
  gallery.setOwner(data.jobProcessor.username);
  const galleryId = portfolio.createGallery(data.catalogId, gallery);
  if (dupData) {
    for (let filename in dupData) {
      let itemData = dupData[filename];
      if (itemData.length > 1) {
        portfolio.log('found dup: ' + filename);
        portfolio.addAssetsToGallery(data.catalogId, galleryId, itemData);
      }
    }
  }
}

function makeDupKey(itemState) {
  let key = '';
  if (USE_FILESIZE) {
    let file = new File(itemState.productPath);
    if (!file.exists()) {
      throw 'Unable to find size of "' + file.getAbsolutePath() + '"';
    }
    key += new File(itemState.productPath).length() + ' ';
  }
  if (USE_FILENAME) {
    key += itemState.filename;
  }
  return key;
}
