(function () {

  const button_search = document.getElementById('button-search');
  const input_search = document.getElementById('input-search');

  let last_input = null;
  input_search.addEventListener("keyup", function (event) {

    if (input_search.value === last_input)
      return;

    const input = last_input = input_search.value;

    load_transponders({
      has_lended_transponders: g_has_lended_transponders,
      query: input.toLowerCase()
    });

  });

})();
