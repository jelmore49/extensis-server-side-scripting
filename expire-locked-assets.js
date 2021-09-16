// Sample script that runs on a timer controlled by a cron expression.
// It queries for expired assets, and locks them if they are not already locked.
//
// It's unclear whether, for this purpose, there is any advantage to using a script versus
// running an external process that uses the API. Perhaps the biggest advantage would be
// that all scripting is in one place.

load("nashorn:mozilla_compat.js");

function getProperties() {
  // Run every 5 seconds starting at the beginning of each minute.
  // This would be much too frequent for production, but is convenient for testing.
  // For production, something like '0 0 0/4 * * ?', every 4 hours.
  // See http://www.quartz-scheduler.org/documentation/quartz-2.x/tutorials/crontrigger.html.
  return { scheduleInfo: { cronExpression: '0/5 * * * * ?', eventId: 'exampleScheduledScript' }};
}

// Rhino doesn't seem to understand const.
let kField_ExpirationDate = 'Expiration Date';
let kField_LockStatus = 'com.extensis.portfolio.lockStatus';

function onSchedule() {
  portfolio.log('scheduled script running!');

  let now = new Date();
  let monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Query for all assets that have expired in the last month.
  let query = {
    queryTerm: {
      operator: 'operatorAnd',
      subqueries: [
        {
          fieldName: kField_ExpirationDate,
          operator: 'lessThanOrEqualValue',
          values: [ now.toISOString() ],
        },
        {
          fieldName: kField_ExpirationDate,
          operator: 'greaterThanValue',
          values: [ monthAgo.toISOString() ],
        },
      ],
    }
  };

  let queryOptions = {
    pageSize: 100,
    fieldNames: [ kField_LockStatus ]
  };

  let catalogs = portfolio.getCatalogs();
  // Note that catalogs is a java List, so to iterate, you need to use
  // size() and get().
  for (let i = 0; i < catalogs.size(); ++i) {
    let catalog = catalogs.get(i);

    // Only process vault catalogs.
    if (! catalog.getDetailValue('storageType').equals('Vault')) {
      continue;
    }

    let assetIds = [];

    // Collect the assetIds of the expired and unlocked assets.
    processAssetQueryResults(catalog.getCatalogId(), query, queryOptions, function(asset) {
      portfolio.log('found asset');
      let isLocked = asset.getSingleValueForName(kField_LockStatus);
      portfolio.log('isLocked=' + isLocked);
      if (isLocked.equals('false')) {
        assetIds.push(asset.getAssetId());
      }
    });

    if (assetIds.length > 0) {
      portfolio.log('locking ' + assetIds.length + ' assets for catalog ' + catalog.getName());
      // For scalability, we may need to batch this call. Also, we may want to process failures.
      // For example, checked out assets can't be locked.
      portfolio.lockUnlockAssets(catalog.getCatalogId(), assetIds, true);
    }
  }
}

// Iterate through a potentially large result set of assets.
function processAssetQueryResults(catalogId, assetQuery, queryOptions, func) {
  queryOptions.startingIndex = 0;
  let shouldContinue = false;
  while (true) {
    let queryResults = portfolio.getAssets(catalogId, assetQuery, queryOptions);
    let assets = queryResults.getAssets();
    for (let i = 0; i < assets.length; ++i) {
      shouldContinue = func(assets[i]);
      if (! shouldContinue) {
        break;
      }
    }
    if (! shouldContinue || queryResults.totalNumberOfAssets <= queryOptions.startingIndex + queryOptions.pageSize) {
      break;
    }
    queryOptions.startingIndex += queryOptions.pageSize;
  }
}
