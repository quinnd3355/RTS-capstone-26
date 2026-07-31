// Illustrative-only toggle for the graceful-degradation mockup.
// Not connected to any live telemetry — purely for showing what the
// dashboard's DEGRADED banner looks like.
(function () {
  const btn = document.getElementById('degrade-toggle');
  const display = document.getElementById('status-display');
  if (!btn || !display) return;

  const textEl = display.querySelector('.status-text');

  let degraded = false;

  btn.addEventListener('click', function () {
    degraded = !degraded;
    btn.setAttribute('aria-pressed', String(degraded));
    display.classList.toggle('status-nominal', !degraded);
    display.classList.toggle('status-degraded', degraded);
    btn.textContent = degraded ? 'SIMULATE RECOVER' : 'SIMULATE DEGRADE';
    textEl.textContent = degraded
      ? 'DEGRADED — UAV-01 BEACON PAUSED'
      : 'NOMINAL — UAV-01 BEACON ACTIVE';
  });
})();
