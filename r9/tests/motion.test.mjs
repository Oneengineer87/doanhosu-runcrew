import assert from "node:assert/strict";
import test from "node:test";
import { clamp, heroMotion, routeDraw } from "../motion.js";

test("motion values never exceed their visual safety range", () => {
  assert.equal(clamp(-2), 0);
  assert.equal(clamp(2), 1);
  assert.deepEqual(heroMotion(2), { imageScale: 1.03, lightOffsetY: 18, lightOpacity: 0.8 });
});

test("reduced motion has a stable final state", () => {
  assert.deepEqual(heroMotion(0.8, true), { imageScale: 1, lightOffsetY: 0, lightOpacity: 0.68 });
  assert.deepEqual(routeDraw(0.1, true), { pathProgress: 1, labelVisible: true });
});

test("route label appears only after the route is sufficiently drawn", () => {
  assert.equal(routeDraw(0.54).labelVisible, false);
  assert.equal(routeDraw(0.55).labelVisible, true);
});
