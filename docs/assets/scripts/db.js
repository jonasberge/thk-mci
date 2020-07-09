const config = {
  localStorage_key: 'data.sqlite',
  localStorage_tsKey: 'data.sqlite.ts',
  paths: {
    vendor: resolvePath('/vendor/sql-js'),
    model: resolvePath('/assets/sqlite/model.sql'),
    data: resolvePath('/assets/sqlite/data.sql')
  }
};


// get's the SQL object which implements SQLite.
const get_sql = (function () {

  promise = null;

  return function () {

    if (promise)
      return promise;

    promise = new Promise(function (resolve, reject) {
      options = {
        locateFile: function (filename) {
          return config.paths.vendor + '/' + filename;
        }
      };

      initSqlJs(options).then(function (value) {
        resolve(SQL = value);
      }, reject);
    });

    return promise;
  };

})();


// get an sqlite database instance.
// initializes a new one if no database is found in the browser storage.
// the model and initial data should come from the files specified in the config.
const get_db = (function () {

  promise = null;

  return function (options) {

    if (options && options.reset) {
      window.localStorage.removeItem(config.localStorage_key);
      promise = null;
    }

    if (promise)
      return promise;

    promise = new Promise(function (_resolve, reject) {

      resolve = function (value) {
        console.log('Database successfully loaded.');
        _resolve(value);
      };

      Promise.all([
        get_sql(),
        get_db_revision_remote()
      ]).then(function ([ SQL, last_modified ]) {

        const is_outdated = last_modified > get_db_revision_local();
        const stored = window.localStorage.getItem(config.localStorage_key);

        if (stored && !is_outdated)
          return resolve(db = new SQL.Database(toBinArray(stored)));

        if (stored && is_outdated)
          console.warn('Local database model is outdated. Fetching latest.')

        if (!stored && is_outdated)
          console.warn('No local database found. Fetching from remote.')

        Promise.all([
          fetchTextCached(config.paths.model),
          fetchTextCached(config.paths.data)
        ]).then(function (values) {

          const now = new Date().toISOString();
          window.localStorage.setItem(config.localStorage_tsKey, now);

          db = new SQL.Database();
          for (sql of values)
            db.exec(sql);
          resolve(db);

        }, reject);

      }, reject);
    });

    return promise;
  };

})();


// get the revision (date) of the local database.
get_db_revision_local = function () {
  timestamp = window.localStorage.getItem(config.localStorage_tsKey);
  return timestamp ? new Date(timestamp) : null;
};


// get the revision (last date of modification) of the remote database model.
get_db_revision_remote = function () {
  return getLastModified(config.paths.model);
};


// resets the database to the initial state (dummy data in data.sql).
const reset_db = function () {
  return get_db({ reset: true });
};


// persists changes made to the database in the browser's storage.
// you shouldn't need to call this explicitly, since it's saved on exit.
const persist_db = function () {
  return new Promise(function (resolve, reject) {
    get_db().then(function (db) {
      const key = config.localStorage_key;
      const value = toBinString(db.export());
      window.localStorage.setItem(key, value);
      resolve();
    }, reject);
  });
};


// persist data when the browser/tab is closed.
window.addEventListener('beforeunload', function (e) {
  persist_db();
});


// -- HELPERS -- //

const with_db = function (decorated) {
  return function () {
    return new Promise(function (resolve, reject) {
      get_db().then(function (db) {
        resolve(decorated(db));
      }, reject);
    });
  };
};

const create_callable_db_query = function (query) {
  return with_db(function (db) {
    const stmt = db.prepare(query);

    result = [];
    while (stmt.step())
      result.push(stmt.getAsObject());

    return result;
  });
};


// -- DEBUG INFORMATION -- //

get_db_revision_remote().then(function (last_modified) {
  console.log('Database model last modified at:', last_modified);
  console.log('Local database is from:', get_db_revision_local() || undefined);
});
