(function () {
  all_modals = [];
  backgrounds = document.querySelectorAll('div.modal-background');

  for (modal_background of backgrounds) {
    all_modals.push(modal_background.closest('.modal'));

    modal_background.addEventListener('click', function () {
      for (modal of all_modals)
        modal.style.display = 'none';
    });
  }
})();
