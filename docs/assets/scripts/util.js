// decodes a string into a binary array.
// https://github.com/sql-js/sql.js/blob/v1.3.0/examples/persistent.html#L18
function toBinArray(str) {
  const len = str.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++)
    arr[i] = str.charCodeAt(i);
  return arr;
}

// encodes a binary array as a string.
// https://github.com/sql-js/sql.js/blob/v1.3.0/examples/persistent.html#L25
function toBinString(arr) {
  arr = new Uint8Array(arr);
  const strings = []
  const chunksize = 0xffff;

  // There is a maximum stack size.
  // We cannot call String.fromCharCode with as many arguments as we want
  for (let i = 0; i * chunksize < arr.length; i++) {
    const sub = arr.subarray(i * chunksize, (i + 1) * chunksize);
    strings.push(String.fromCharCode.apply(null, sub));
  }

  return strings.join('');
}


function resolvePath(path) {
  const root = '/thk-mci';
  const domains = [ 'vonas.github.io', 'abla.ge' ];

  if (!domains.includes(location.hostname))
    return path;

  return root + '/' + path.replace(/^\/+/g, '');
}


// fetches a ressource's header.
function fetchHeader(url, name) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', reject);
    xhr.addEventListener('load', function (e) {
      if (xhr.status == 200)
        return resolve(xhr.getResponseHeader(name));
      reject(xhr.status);
    });

    xhr.open('HEAD', url, true);
    xhr.send();

  });
}


// fetches the date of last modification of a resource.
function getLastModified(url) {
  return new Promise(function (resolve, reject) {
    fetchHeader(url, 'Last-Modified').then(function (value) {
      resolve(new Date(value));
    }, reject);
  });
}


// load text from a URL or path.
function fetchText(path) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', reject);
    xhr.addEventListener('load', function (e) {
      if (xhr.status == 200)
        return resolve(xhr.response);
      reject(xhr.status);
    });

    xhr.open('GET', path, true);
    xhr.send();

  });
}


// fetches text and saves it in the browser's storage.
// when fetching it twice or more, the resource is tested for modifications.
// if it was modified, it's refetched and the old data is overwritten.
const fetchTextCached = (function () {

  prefix = 'ftc.';

  return function (path) {
    return new Promise(function (resolve, reject) {

      const key = prefix + window.btoa(path);
      const ts_key = key + '.ts';

      getLastModified(path).then(function (last_modified) {

        last_fetched = new Date(window.localStorage.getItem(ts_key));

        const stored = window.localStorage.getItem(key);
        const is_expired = last_fetched < last_modified || !stored;

        if (!is_expired)
          return resolve(stored);

        fetchText(path).then(function (text) {
          window.localStorage.setItem(key, text);
          window.localStorage.setItem(ts_key, last_modified.toISOString());
          resolve(text);
        }, reject);

      }, reject);
    });
  };

})();
