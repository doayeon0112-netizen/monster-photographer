'use strict';

// Mouse events fire for each button in a chord. Pointerdown only fires for
// the first pressed mouse button, so it cannot handle right-held + left-click.
MP.bindMouseButtons = function(stage, host, { isPlaying, isReloading, setAiming, shoot }) {
  function onDown(event) {
    if (!isPlaying() || event.target.closest('button')) return;
    if (event.button === 2) {
      event.preventDefault();
      if (!isReloading()) setAiming(true);
    } else if (event.button === 0) {
      event.preventDefault();
      shoot();
    }
  }
  function onUp(event) {
    if (event.button === 2) setAiming(false);
  }
  stage.addEventListener('mousedown', onDown);
  host.addEventListener('mouseup', onUp);
  return () => {
    stage.removeEventListener('mousedown', onDown);
    host.removeEventListener('mouseup', onUp);
  };
};
