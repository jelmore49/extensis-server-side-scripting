//
// Example javascript for Portfolio custom scripting
//
// When a file is added to a gallery called 'media', create a watermarked derivative and add it
// to another catalog.
//

load("nashorn:mozilla_compat.js");

// Entry point
function getProperties() {
  return { triggerPoints: ['onGalleryChanged'] };
}

function getCatalogIdForName(name) {
  let catalogs = portfolio.getCatalogs();
  for (let i = 0; i < catalogs.size(); ++i) {
    let cat = catalogs.get(i);
    if (cat.getName().equals(new java.lang.String(name))) {
      return cat.getCatalogId();
    }
  }
  return null;
}

function changeExtension(filename, newExt) {
  filename = String(filename);
  let i = filename.lastIndexOf('.');
  if (i >= 0) {
    return filename.substring(0, i + 1) + newExt;
  } else {
    return filename + '.' + newExt;
  }
}

// Entry point
function onGalleryChanged(catalogId, galleryId, wereItemsAdded, assetQuery, assetCount) {
  portfolio.log('onGalleryChanged called for catalog ' + catalogId + ', gallery ' + galleryId + ', ' + assetCount + ' assets ' + (wereItemsAdded ? 'added' : 'removed'));

  if (!wereItemsAdded) {
    return;
  }

  let gallery = portfolio.getGallery(catalogId, galleryId);
  if (gallery.getName().equals('media')) {
    portfolio.log('media gallery found');

    let lowresCatalogId = getCatalogIdForName('lowres-fs');
    portfolio.log('lowres id is ' + lowresCatalogId);

    let queryOptions = {
      pageSize: 100,
      fieldNames: [ 'Path', 'Filename' ]
    };

    let mediaRequest = {
      derivative: {
        type: 'Derivative',
        DerivativeFormat: 'JPEG',
        MaxDimensionX: '1000',
        MaxDimensionY: '1000',
        JpegQuality: '87',
        Colorspace: 'RGB',
        Resolution: '72',
        Upscale: false,
        AlwaysColorCorrect: true,
        StripColorProfile: true,
        ApplyDynamicRangeStretch: true,
        Watermark: 'Copyright Extensis, Inc.',
        WatermarkType: 'text',
        WatermarkPosition: 'center',
        WatermarkFont: 'Zapfino',
        WatermarkFontStyle: 'normal',
        WatermarkFontSize: '20',
        WatermarkColor: Number(0xff00bb).toString(), // fuscia
        WatermarkTransparency: '70',
      }
    };

    let queryResults = portfolio.getAssets(catalogId, assetQuery, queryOptions);
    let assets = queryResults.getAssets();
    for (let i = 0; i < assets.length; ++i) {
      let asset = assets[i];
      let mpResult = portfolio.processMedia(catalogId, asset, mediaRequest);
      let content = mpResult.getComponent('derivative').content;
      let filename = asset.getSingleValueForName('Filename');
      let tmpfile = String(portfolio.getWorkFolderPath()) + '/d.jpg';
      let out = new java.io.FileOutputStream(tmpfile);
      out.write(content);
      out.close();
      portfolio.catalogFile(lowresCatalogId, '::administorsmbp2:Macintosh HD:Users:Shared:Portfolio:lowres-fs Files:' + changeExtension(filename, 'jpg'), tmpfile);
    }
  }
}
