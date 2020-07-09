(function () {
  for (modal_background of document.querySelectorAll('div.modal-background'))
    modal_background.addEventListener('click', function () {
      g_close_modal();
    });
})();
