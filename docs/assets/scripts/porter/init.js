const load_transponders = (function () {

  const table = document.querySelector('#table-transponder');

  const create_td_with = function (value) {
    const td = document.createElement('td');
    td.innerText = value;
    return td;
  };

  const formatSeconds = function (s) {
    result = '';
    if (!s)
      return result;

    t = secondsToTime(s);

    if (t.h > 0)
      result += t.h + ' Stunde' + (t.h == 1 ? '' : 'n');

    if (t.m > 0) {
      if (t.h > 0)
        result += ' und';
      result += ' ' + t.m + ' Minute' + (t.m == 1 ? '' : 'n');
    }

    return result;
  }

  let last_timeout = null;

  return function () {

    if (last_timeout)
      clearTimeout(last_timeout);

    return new Promise(function (resolve, reject) {

      return query_transponders().then(function (result) {
        tds = [];

        while (table.firstChild)
          table.removeChild(table.firstChild);

        for (room of result) {
          const rental_time = formatSeconds(room.diff_seconds);

          const tr = document.createElement('tr');
          const items = {
            room_name: room.room_name,
            responsible_professor: room.responsible_professor,
            transponder_list: room.transponder_list,
            rental_time: rental_time,
            is_rented: room.is_rented ? 'Rot' : 'Grün',
            icon: '<icon>'
          }

          for (key in items) {
            if (items.hasOwnProperty(key)) {
              const td = document.createElement('td');
              td.innerText = items[key];
              tr.appendChild(td);
              if (key == 'rental_time') {
                td.dataset.seconds = room.diff_seconds;
                tds.push(td);
              }
            }
          }

          table.appendChild(tr);
        }

        const timeout_seconds = 1;
        const timeout_function = function () {
          for (td of tds) {
            seconds = parseInt(td.dataset.seconds) + timeout_seconds;
            td.innerText = formatSeconds(seconds);
            td.dataset.seconds = seconds;
          }
        };

        (function create_timeout() {
          last_timeout = setTimeout(function () {
            timeout_function();
            create_timeout();
          }, timeout_seconds * 1000);
        })();

        resolve();

      }, reject);

    });

  };

})();

const load_transponders_errorFunc = function (reason) {
  console.error('Could not load transponders', reason);
};

load_transponders().then(function () {}, load_transponders_errorFunc);
