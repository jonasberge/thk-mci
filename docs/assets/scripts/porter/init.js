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

    if (result.length == 0)
      result = 'Gerade eben';

    return result;
  }

/*

<span class="icon is-small has-text-success">
  <i class="fas fa-circle"></i>
</span>
*/

  const create_circle = function () {
    const span = document.createElement('span');
    span.classList.add('icon', 'is-small');
    const icon = document.createElement('i');
    icon.classList.add('fas', 'fa-circle');
    span.appendChild(icon);
    return span;
  };

  const create_circle_with_class = function (class_name) {
    const circle = create_circle();
    circle.classList.add(class_name);
    return circle;
  };

  const green_circle = (function () {
    const circle = create_circle_with_class('has-text-success');
    circle.title = 'Verfügbar';
    return circle.outerHTML;
  })();

  const red_circle = (function () {
    const circle = create_circle_with_class('has-text-danger');
    circle.title = 'Ausgeliehen';
    return circle.outerHTML;
  })();

  let last_timeout = null;

  return function () {

    if (last_timeout)
      clearTimeout(last_timeout);

    return new Promise(function (resolve, reject) {

      const delimiter = '|||';
      const span = document.createElement('span');
      span.classList.add('grey', 'italic');
      span.innerHTML = delimiter;

      const outerHTML = span.outerHTML.replace(/'/g, "''");;
      const [ left_span, right_span ] = outerHTML.split(delimiter);

      return execute_db_query(`

           SELECT room.name as room_name,
                  professor.name as responsible_professor,
                  group_concat(
                    CASE WHEN transponder.borrow_time IS NULL
                      THEN room_transponder.transponder_id
                      ELSE '${ left_span }' || room_transponder.transponder_id || '${ right_span }'
                    END
                  , ', ') as transponder_list,
                  strftime('%s', datetime('now', 'localtime')) - strftime('%s', MIN(transponder.borrow_time)) as diff_seconds,
                  transponder.borrow_time IS NOT NULL as is_rented
             FROM room
        LEFT JOIN professor ON room.responsible_professor_id = professor.id
       INNER JOIN room_transponder ON room.id = room_transponder.room_id
       INNER JOIN transponder ON room_transponder.transponder_id = transponder.id
         GROUP BY room.id

      `).then(function (result) {
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
            is_rented: room.is_rented ? red_circle : green_circle
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
