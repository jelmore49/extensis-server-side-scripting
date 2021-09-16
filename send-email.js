load("nashorn:mozilla_compat.js");

function getProperties() {
  return { triggerPoints: ['onGalleryChanged'] };
}

let recipients = [ 'bbrown@extensis.com' ];

let css = '\
p { font-family: sans-serif; }\
\
table#assets {\
    font-size:16px;\
    font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;\
    border-collapse: collapse;\
    border-spacing: 0;\
    width: 600px;\
}\
\
#assets td, #assets th {\
    border: 1px solid #ddd;\
    text-align: left;\
    padding: 8px;\
}\
#assets img {\
    height: 100px;\
}\
\
#assets tr:nth-child(even){background-color: #f2f2f2}\
\
#assets th {\
    padding-top: 11px;\
    padding-bottom: 11px;\
    background-color: #4CAF50;\
    color: white;\
}';

function onGalleryChanged(catalogId, galleryId, wereItemsAdded, assetQuery, assetCount) {
  portfolio.log('send-email.js');

  let queryOptions = {
    pageSize: 100,
    fieldNames: [ 'Thumbnail', 'Filename' ]
  };

  let gallery = portfolio.getGallery(catalogId, galleryId);
  let catalogName = portfolio.getCatalogName(catalogId);

  if (wereItemsAdded) {
    let queryResults = portfolio.getAssets(catalogId, assetQuery, queryOptions);
    let assets = queryResults.getAssets();
    let images = {};
    let html = '<html><head><title>Your Images</title>';
    html += '<style>' + css + '</style></head>';
    html += '<body>';
    html += '<p>' + assetCount + ' items were added to gallery ' + gallery.getName() + ' in catalog ' + catalogName + '.</p>';
    html += '<table id="assets">';
    html += '<th>Name</th><th>Thumbnail</th>';
    for (let i = 0; i < assets.length; ++i) {
      let asset = assets[i];
      let filename = asset.getSingleValueForName('Filename');
      let thumbnail = asset.getSingleValueForName('Thumbnail');
      html += '<tr><td>' + filename + '</td><td><img height="128" src="' + asset.getAssetId() + '"></td></tr>\n';
      images[asset.getAssetId()] = thumbnail;
    }
    html += '</table></body></html>';
    portfolio.sendHtmlEmail(recipients, 'Items added to gallery ' + gallery.getName(), html, images);
  } else {
    portfolio.sendSimpleEmail(recipients, 'Items removed from gallery ' + gallery.getName(), assetCount + ' items were removed from gallery ' + gallery.getName() + ' in catalog ' + catalogName);
  }
}
