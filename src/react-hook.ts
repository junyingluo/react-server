/* eslint-disable @typescript-eslint/no-unused-vars */
"use strict";

let currentlyRenderingComponent = null;
let firstWorkInProgressHook = null;
let workInProgressHook = null;
// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate = false;
// Lazily created map of render-phase updates
let renderPhaseUpdates = null;
// Counter to prevent infinite loops.
let numberOfReRenders = 0;

function prepareToUseHooks(componentIdentity) {
  currentlyRenderingComponent = componentIdentity;
}

function finishHooks(Component, props, children, refOrContext) {
  // This must be called after every function component to prevent hooks from
  // being used in classes.

  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    workInProgressHook = null;

    children = Component(props, refOrContext);
  }
  currentlyRenderingComponent = null;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  renderPhaseUpdates = null;
  workInProgressHook = null;

  return children;
}
