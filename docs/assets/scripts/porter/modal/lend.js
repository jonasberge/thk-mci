(function () {

  const button_modal_transponder_verleih = document.getElementById('btn_trans_verleih')
  const modal_transponder_verleih = document.getElementById('mdl_trans_verleih')
  const button_close_transponder_verleih = document.getElementById('btn_close_trans_verleih')
  const button_confirm_transponder_verleih = document.getElementById('btn_confirm_trans_verleih');

  const show_modal = function () {
    modal_transponder_verleih.style.display = 'block';
    button_confirm_transponder_verleih.disabled = 'true';
    button_check_multica.disabled = 'true';
    input_room_number.focus();
    set_options_all_transponders();

    g_close_modal = hide_modal;
  };

  const hide_modal = function () {
    modal_transponder_verleih.style.display = 'none';
    button_check_multica.disabled = 'true';
    reset_scanner_message();
    reset_modal();
    revert_button_loading();
    reset_signature();
    g_close_modal = g_noop;
  };

  const reset_modal = function () {
    input_room_number.value = '';
    button_check_multica.classList.remove('is-success');
    for (key in button_confirm_preconditions)
      if (button_confirm_preconditions.hasOwnProperty(key))
        button_confirm_preconditions[key] = false;
    reset_select()
    remove_options();
  };

  const input_room_number = document.getElementById('input-room-number');
  const select_transponder_number = document.getElementById('select-transponder-number');
  const select_option_meta = document.getElementById('select-option-meta');

  const info_scanner_container = document.getElementById('info-scanner-container');
  const info_scanner_message = document.getElementById('info-scanner-message');
  const icon_scanner = document.getElementById('scanner-icon');
  const button_check_multica = document.getElementById('button-check-multica');

  const signature_message = document.getElementById('signature-message');
  const signature_icon = document.getElementById('signature-icon');
  const button_signature = document.getElementById('signature-button');

  button_modal_transponder_verleih.onclick = function(){ show_modal(); };

  const reset_scan = function () {
    clearTimeout(scanner_message_timeout);
    set_confirm_precondition('scanned_multica', false);
    revert_button_loading();
    reset_scanner_message();
    button_check_multica.disabled = 'true';
  };

  select_transponder_number.addEventListener('change', function (event) {
    reset_scan();

    if (this.value != 0) {
      set_confirm_precondition('selected_transponder', parseInt(this.value));
      button_check_multica.disabled = '';
      this.classList.remove('grey');
      return;
    }
    this.classList.add('grey');
    button_check_multica.disabled = 'true';
  });

  let last_input = null;
  input_room_number.addEventListener("keyup", function(event) {

    if (input_room_number.value === last_input)
      return;

    reset_scan();

    const input = input_room_number.value;
    last_input = input;
    if (input.length == 0) {
      reset_modal();
      set_options_all_transponders();
      return;
    }

    const room_id = convert_input_to_room_id(input);
    reset_select();

    execute_db_query(`

       SELECT
         transponder_id as id,
         transponder.borrow_time IS NOT NULL as is_lended
       FROM room_transponder
       INNER JOIN transponder ON room_transponder.transponder_id = transponder.id
       WHERE room_id = ?
       GROUP BY transponder_id
       ORDER BY is_lended, transponder_id

    `, [ room_id ]).then(function (result) {
      set_options(result, function (id) { return 'Transponder ' + id; });
      set_confirm_precondition('selected_transponder', false);
    }, function (reason) {
      console.error('Could not retrieve room from database');
    });
  });

  scanner_message_timeout = null;
  button_confirm_preconditions = {
    scanned_multica: false,
    selected_transponder: false
  };

  const set_confirm_precondition = function (key, value) {
    key = key.toLowerCase();

    if (!button_confirm_preconditions.hasOwnProperty(key))
      return
    button_confirm_preconditions[key] = value;

    let sum = true;
    for (key in button_confirm_preconditions)
      if (button_confirm_preconditions.hasOwnProperty(key))
        sum = sum && !!button_confirm_preconditions[key];

    button_confirm_transponder_verleih.disabled = sum ? '' : 'true';
  };

  button_check_multica.onclick = function () {
    hide_scanner_icon();
    loading_done = make_button_loading(button_check_multica);

    show_scanner_message('Scanne MultiCa...');
    scanner_message_timeout = setTimeout(function () {
      set_confirm_precondition('scanned_multica', true);
      show_scanner_message('Student "Alex Brimm" ist berechtigt!');
      scanner_success();
      loading_done();
    }, 400 + Math.floor(Math.random() * 800));
  };

  button_signature.onclick = function () { confirm_signature(); };

  button_close_transponder_verleih.onclick = function(){
    hide_modal();
  };

  button_confirm_transponder_verleih.onclick = function(){
    transponder_id = button_confirm_preconditions.selected_transponder;
    hide_modal();

    if (transponder_id) {
      console.log(transponder_id);
      execute_db_query(`

        UPDATE transponder
        SET borrow_time = datetime('now', 'localtime')
        WHERE id = ?

      `, [ transponder_id ]).then(function (result) {
        // TODO: open a modal that informs the user about the operation being successful.
        load_transponders().then(function () {}, load_transponders_errorFunc);
      }, function (reason) {
        console.error('Could not lend transponder', reason);
      });
    }
  };

  const convert_input_to_room_id = function (input) {
    return parseInt(input.replace(/[\.,]+/g, ''));
  };

  const remove_options = function () {
    options = select_transponder_number.querySelectorAll('#select-transponder-number option:not(:first-child)')
    for (option of options) {
      select_transponder_number.removeChild(option);
    }
  };

  const insert_options = function (transponders, formatter) {
    formatter = formatter || function (v) { return v; };

    for (transponder of transponders) {
      option = document.createElement('option');
      option.value = transponder.id;
      option.innerText = formatter(transponder.id);

      if (transponder.is_lended) {
        option.innerText += ' (ausgeliehen)';
        option.disabled = 'true';
      }

      select_transponder_number.appendChild(option);
    }

    let available_count = transponders.reduce(function (n, t) { return n + !t.is_lended; }, 0);
    const unavailable_count = transponders.length - available_count;

    if (available_count == 0)
      available_count = 'keine';
    else if (available_count == 1)
      available_count = 'einen';

    let text = 'Es gibt ' + available_count + ' Transponder';
    if (unavailable_count > 0) text += ' (+' + unavailable_count + ')';

    select_option_meta.innerText = text;
  };

  const set_options = function (transponders, formatter) {
    remove_options();
    insert_options(transponders, formatter);
  };

  const set_options_all_transponders = function () {
    return new Promise(function (resolve, reject) {
      execute_db_query(`

         SELECT
           transponder_id as id,
           transponder.borrow_time IS NOT NULL as is_lended
         FROM room_transponder
         INNER JOIN transponder ON room_transponder.transponder_id = transponder.id
         GROUP BY transponder_id
         ORDER BY transponder_id

      `).then(function (result) {
        set_options(result, function (id) { return 'Transponder ' + id; });
        resolve();
      }, function (reason) {
        console.error('Could not retrieve room from database');
        reject();
      });
    });
  };

  const reset_select = function () {
    select_transponder_number.value = 0;
    select_transponder_number.classList.add('grey');
  };

  const reset_scanner_message = function () {
    info_scanner_container.style.display = 'none';
    info_scanner_message.innerText = '';
    clearTimeout(scanner_message_timeout);
    hide_scanner_icon();
  };

  const show_scanner_message = function (message) {
    info_scanner_container.style.display = 'inherit';
    info_scanner_message.innerText = message;
  };

  const scanner_success = function () {
    icon_scanner.style.display = 'inline';
    info_scanner_container.classList.add('has-text-success');
  };

  const hide_scanner_icon = function () {
    icon_scanner.style.display = 'none';
    info_scanner_container.classList.remove('has-text-success');
  };

  const revert_button_loading = function () {
    button_check_multica.classList.remove('is-loading', 'is-info');
    info_scanner_container.classList.remove('has-text-info');
    button_check_multica.disabled = '';
  };

  const make_button_loading = function (button) {
    button_check_multica.classList.add('is-loading', 'is-info');
    info_scanner_container.classList.add('has-text-info');
    button_check_multica.disabled = 'true';

    return revert_button_loading;
  };

  const reset_signature = function () {
    signature_message.style.display = '';
    signature_icon.style.display = 'none';
    button_signature.disabled = '';
    button_signature.classList.add('is-link');
  };

  const confirm_signature = function () {
    signature_message.style.display = 'none'
    signature_icon.style.display = '';
    button_signature.disabled = 'true';
    button_signature.classList.remove('is-link');
  };

})();
