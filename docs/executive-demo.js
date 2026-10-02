// Public-safe interface reconstruction. Every displayed figure is invented.
(function () {
  window.ExecutiveDemo = {
    init: function () {
      document.querySelectorAll('.exec-stage').forEach(function (stage) {
        if (stage.dataset.sized) return;
        stage.dataset.sized = 'true';
        function fit() { stage.style.setProperty('--exec-scale', stage.clientWidth / 1920); }
        fit();
        new ResizeObserver(fit).observe(stage);
      });
    }
  };
  function activate(button, focus) {
    var shell = button.closest('.exec-shell');
    shell.dataset.active = button.dataset.execTab;
    shell.querySelectorAll('[data-exec-tab]').forEach(function (tab) {
      var selected = tab === button;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) button.focus();
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-exec-tab]');
    if (button) activate(button, false);
  });
  document.addEventListener('keydown', function (event) {
    var button = event.target.closest('[data-exec-tab]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    var tabs = Array.from(button.closest('.exec-tabs').querySelectorAll('[data-exec-tab]'));
    var index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.indexOf(button) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    activate(tabs[index], true);
  });
})();
