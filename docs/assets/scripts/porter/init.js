const clear_transponders = (function () {

  const table = document.querySelector('#table-transponder');

  return function () {
    while (table.firstChild)
      table.removeChild(table.firstChild);
  };

})();

const insert_transponders = (function () {

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

    if (result.length == 0)
      result = 'Gerade eben';

    return result;
  }

  const create_circle = function (name) {
    const span = document.createElement('span');
    span.classList.add('icon', 'is-small');
    const icon = document.createElement('i');
    icon.classList.add('fas', 'fa-' + name);
    span.appendChild(icon);
    return span;
  };

  const create_circle_with_class = function (name, class_name) {
    const circle = create_circle(name);
    circle.classList.add(class_name);
    return circle;
  };

  const green_circle = (function () {
    const circle = create_circle_with_class('circle', 'has-text-success');
    circle.title = 'Verfügbar';
    return circle.outerHTML;
  })();

  const small_green_circle = (function () {
    const circle = create_circle_with_class('dot-circle', 'has-text-success');
    circle.classList.remove('is-small');
    circle.classList.add('is-very-small');
    circle.title = 'Teilweise Verfügbar';
    return circle.outerHTML;
  })();

  const red_circle = (function () {
    const circle = create_circle_with_class('circle', 'has-text-danger');
    circle.title = 'Ausgeliehen';
    return circle.outerHTML;
  })();

  let last_timeout = null;

  return function (rooms) {

    tds = [];

    for (room of rooms) {
      const rental_time = formatSeconds(room.diff_seconds);

      const tr = document.createElement('tr');
      const items = {
        is_rented: room.is_all_rented ? red_circle : (room.is_rented ? small_green_circle : green_circle),
        room_name: room.room_name,
        responsible_professor: room.responsible_professor,
        transponder_list: room.transponder_list,
        rental_time: rental_time
      }

      for (key in items) {
        if (items.hasOwnProperty(key)) {
          const td = document.createElement('td');
          td.innerHTML = items[key];
          tr.appendChild(td);
          if (key == 'is_rented') {
            td.style.textAlign = 'center';
          }
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

    clearTimeout(last_timeout);
    (function create_timeout() {
      last_timeout = setTimeout(function () {
        timeout_function();
        create_timeout();
      }, timeout_seconds * 1000);
    })();

  };

})();

const load_transponders = (function () {

  return function (options) {

    const has_lended_transponders = !!options && options.has_lended_transponders;

    return new Promise(function (resolve, reject) {

      const delimiter = '|||';
      const span = document.createElement('span');
      span.classList.add('grey', 'italic');
      span.innerHTML = delimiter;

      const outerHTML = span.outerHTML.replace(/'/g, "''");;
      const [ left_span, right_span ] = outerHTML.split(delimiter);

      const having_clause = `
        HAVING MIN(transponder.borrow_time) IS NOT NULL
      `;

      return execute_db_query(`

           SELECT room.name as room_name,
                  professor.name as responsible_professor,
                  group_concat(
                    CASE WHEN transponder.borrow_time IS NULL
                      THEN ${ has_lended_transponders ? 'NULL' : 'room_transponder.transponder_id' }
                      ELSE '${ left_span }' || room_transponder.transponder_id || '${ right_span }'
                    END
                  , ', ') as transponder_list,
                  strftime('%s', datetime('now', 'localtime')) - strftime('%s', MIN(transponder.borrow_time)) as diff_seconds,
                  transponder.borrow_time IS NOT NULL as is_rented,
                  SUM(transponder.borrow_time IS NOT NULL) = COUNT(room.id) as is_all_rented
             FROM room
        LEFT JOIN professor ON room.responsible_professor_id = professor.id
       INNER JOIN room_transponder ON room.id = room_transponder.room_id
       INNER JOIN transponder ON room_transponder.transponder_id = transponder.id
         GROUP BY room.id
                  ${ has_lended_transponders ? having_clause : '' }

      `).then(function (result) {

        clear_transponders();
        insert_transponders(result);
        resolve();

      }, reject);

    });

  };

})();

const load_transponders_errorFunc = function (reason) {
  console.error('Could not load transponders', reason);
};

load_transponders().then(function () {}, load_transponders_errorFunc);
