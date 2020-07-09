(function () {

  let selected_transponder_id = null;

  const button_modal_transponder_rückgabe = document.getElementById('btn_trans_rückgabe')
  const modal_transponder_rückgabe = document.getElementById('mdl_trans_rückgabe')
  const button_close_transponder_rückgabe = document.getElementById('btn_close_trans_rückgabe')
  const button_transponder_check = document.getElementById('btn_trans_rückgabe_prüfen')
  const button_cancel_rückgabe = document.getElementById('btn_close_trans_abbrechen')

  button_cancel_rückgabe.onclick = function () {
    modal_transponder_rückgabe.style.display = 'none';
  };

  button_modal_transponder_rückgabe.onclick = function(){
    modal_transponder_rückgabe.style.display = 'block';

    input_element.focus();
    button_close_transponder_rückgabe.disabled='true';
  };

  button_close_transponder_rückgabe.onclick = function(){
    modal_transponder_rückgabe.style.display = 'none';

    console.log(selected_transponder_id);

    // return the transponder.
    if (selected_transponder_id) {
      console.log(selected_transponder_id);
      execute_db_query(`

        UPDATE transponder
        SET borrow_time = NULL
        WHERE id = ?

      `, [ selected_transponder_id ]).then(function (result) {
        // TODO: open a modal that informs the user about the operation being successful.
        load_transponders().then(function () {}, load_transponders_errorFunc);
      }, function (reason) {
        console.error('Could not return transponder', reason);
      });
    }

    reset_modal();
    input_element.value = '';
  };

  const input_element = document.querySelector('#input-transponder-number');
  const result_container = document.querySelector('#container-lending-info');
  const room_title = result_container.querySelector('.info-title-room');
  const elements = {
    room: result_container.querySelector('.info-room'),
    lender: result_container.querySelector('.info-lender'),
    lending_time: result_container.querySelector('.info-lending-time'),
    current_time: result_container.querySelector('.info-current-time'),
    on_time: result_container.querySelector('.info-on-time')
  };

  // submit input field on typing
  input_element.addEventListener("keyup", function(event) {
    if (input_element.value.length == 0)
      reset_modal();
    else button_transponder_check.click();
  });

  // load the data of the transponder.
  button_transponder_check.onclick = function(){

    const input = input_element.value;
    if (input.length == 0) return;

    const transponder_id = convert_input_to_transponder_id(input);

    execute_db_query(`

       SELECT transponder.id,
              transponder.borrow_time,
              GROUP_CONCAT(room.name, ', ') as room_name,
              COUNT(room.id) as room_count
         FROM transponder
   INNER JOIN room_transponder ON transponder.id = room_transponder.transponder_id
   INNER JOIN room ON room_transponder.room_id = room.id
        WHERE transponder.id = ?
     GROUP BY transponder.id

    `, [ transponder_id ]).then(function (result) {

      if (!result || result.length == 0)
        return reset_modal();

      button_close_transponder_rückgabe.disabled='';

      transponder = result[0];
      selected_transponder_id = transponder.id;
      console.log(selected_transponder_id, transponder.id);

      if (transponder.room_count > 1)
        room_title.innerText = 'Räume';
      else room_title.innerText = 'Raum';

      elements.room.innerText = transponder.room_name;
      elements.current_time.innerText = format_time(new Date());

      if (transponder.borrow_time) {
        const borrowed_at = new Date(transponder.borrow_time);
        const borrow_date = borrowed_at.toLocaleDateString();
        const borrow_time = format_time(borrowed_at);

        const one_day = 24 * 60 * 60 * 1000;
        const day_difference = Math.round(Math.abs((new Date() - borrowed_at) / one_day))

        let text = borrow_time + ' am ' + borrow_date;
        if (day_difference == 1)
          text = 'Gestern um ' + borrow_time;
        else if (day_difference == 2)
          text = 'Vorgestern um ' + borrow_time;

        elements.lending_time.innerText = text;
        elements.on_time.innerText = day_difference == 1 ? 'Ja' : 'Nein'; // hardcode
        elements.lender.innerText = 'Alex Brimm'; // hardcode
      }
      else {
        elements.lending_time.innerText = '(nicht ausgeliehen)';
        elements.on_time.innerText = '-';
        elements.lender.innerText = '-';
      }

    });

  };

  const convert_input_to_transponder_id = function (input) {
    return parseInt(input.replace(/[\.,]+/g, ''));
  };

  const reset_modal = function () {
    for (key in elements)
      if (elements.hasOwnProperty(key))
        elements[key].innerText = '';
    selected_transponder_id = null;
    room_title.innerText = 'Raum';
    button_close_transponder_rückgabe.disabled='true';
  };

  const format_time = function (date) {
    return date.getHours() + ':' + date.getMinutes() + ' Uhr';
  };

})();
