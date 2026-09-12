const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {}, console, Set, Math };
context.window = context;
vm.createContext(context);
for (const name of ['config.js', 'engine.js', 'input.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', name), 'utf8'), context);
}
const { MP } = context;
const stage = new EventTarget();
stage.closest = () => null;
const host = new EventTarget();
const engine = new MP.Engine(() => .2);
engine.startRound();
engine.zoomIndex = 3;
let shots = 0;
const unbind = MP.bindMouseButtons(stage, host, {
  isPlaying: () => engine.state === 'PLAYING' && !engine.paused,
  isReloading: () => engine.reloadLeft > 0,
  setAiming: value => { engine.aiming = value; },
  shoot: () => { shots++; engine.shoot({ cx: 640, cy: 350, z: engine.zoom, tx: 0, ty: 0 }); }
});
function mouse(target, type, button, buttons) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, { button: { value: button }, buttons: { value: buttons } });
  target.dispatchEvent(event);
}
// Real mouse chord order: right down, left down/up, left down/up, right up.
mouse(stage, 'mousedown', 2, 2);
assert.equal(engine.aiming, true);
assert.equal(engine.zoom, 2);
const monster = engine.targets[0];
monster.phase = 'bothEyes';
monster.x = 320 - (monster.type.eyes[0][0] + monster.type.eyes[1][0]) / 2 * monster.w;
monster.y = 175 - (monster.type.eyes[0][1] + monster.type.eyes[1][1]) / 2 * monster.h;
mouse(stage, 'mousedown', 0, 3);
assert.equal(shots, 1);
assert.equal(engine.captured, 1);
assert.equal(engine.film, 4);
assert.equal(engine.photos[0].zoom, 2);
mouse(host, 'mouseup', 0, 2);
assert.equal(engine.aiming, true);
engine.lock = 0;
mouse(stage, 'mousedown', 0, 3);
mouse(host, 'mouseup', 0, 2);
assert.equal(shots, 2);
assert.equal(engine.film, 3);
assert.equal(engine.aiming, true);
mouse(host, 'mouseup', 2, 0);
assert.equal(engine.aiming, false);
console.log('PASS zoom-held left-click captures; repeated left-clicks preserve aiming; right release restores zoom');
engine.paused = true;
mouse(stage, 'mousedown', 0, 1);
mouse(stage, 'mousedown', 2, 2);
assert.equal(shots, 2);
assert.equal(engine.aiming, false);
engine.paused = false;
engine.reloadLeft = 1;
mouse(stage, 'mousedown', 2, 2);
assert.equal(engine.aiming, false);
engine.reloadLeft = 0;
stage.closest = () => ({});
mouse(stage, 'mousedown', 0, 1);
assert.equal(shots, 2);
stage.closest = () => null;
unbind();
mouse(stage, 'mousedown', 0, 1);
assert.equal(shots, 2);
console.log('PASS pause, reload, HUD buttons and listener cleanup');
// Regression guard for the origin bug: both the layer and individual sprites
// must be anchored. Otherwise their static position falls below the forest image.
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const layer = css.match(/#monsters\s*\{([^}]+)\}/)[1];
const sprite = css.match(/\.monster\s*\{([^}]+)\}/)[1];
assert.match(layer, /position:\s*absolute/);
assert.match(layer, /inset:\s*0/);
assert.match(sprite, /left:\s*0/);
assert.match(sprite, /top:\s*0/);
console.log('PASS monster layer and sprite origins explicitly anchored (CSS regression guard, not browser layout QA)');
