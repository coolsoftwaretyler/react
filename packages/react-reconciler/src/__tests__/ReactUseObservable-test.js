let potentialListener = null;

function ConvertObjectToState(target) {
  const listeners = {};

  const handler = {
    get(target, prop, receiver) {
      if (potentialListener) {
        if (!listeners[prop]) {
          listeners[prop] = new Set();
        }
        listeners[prop].add(potentialListener);
      }

      return Reflect.get(...arguments);
    },
    set(target, prop, value) {
      const result = Reflect.set(...arguments);
      if (listeners[prop]) {
        listeners[prop].forEach(callback => {
          callback();
        });
      }

      return result;
    },
  };

  const proxy = new Proxy(target, handler);
  proxy.$$typeof = 'REACT_OBSERVABLE_TYPE';
  proxy.$$registerObserver = callback => {
    potentialListener = callback;
  };
  return proxy;
}
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

('use strict');

let React;
let ReactNoop;
let Scheduler;
let act;
let use;
let pendingTextRequests;
let waitFor;
let waitForPaint;
let assertLog;
let waitForAll;
let waitForMicrotasks;
let startTransition;

describe('ReactUse', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    use = React.use;
    useDebugValue = React.useDebugValue;
    useState = React.useState;
    useTransition = React.useTransition;
    useMemo = React.useMemo;
    useEffect = React.useEffect;
    Suspense = React.Suspense;
    startTransition = React.startTransition;

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    assertLog = InternalTestUtils.assertLog;
    waitForPaint = InternalTestUtils.waitForPaint;
    waitFor = InternalTestUtils.waitFor;
    waitForMicrotasks = InternalTestUtils.waitForMicrotasks;

    pendingTextRequests = new Map();
  });

  it('basic use(observable)', async () => {
    const observable = ConvertObjectToState({
      name: 'First',
    });

    function Sync() {
      const {name} = use(observable);
      return name;
    }

    function App() {
      return <Sync />;
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);

    await waitForAll([]);
    expect(root).toMatchRenderedOutput('First');

    await act(async () => {
      observable.name = 'Second';
    });
    expect(root).toMatchRenderedOutput('Second');
  });
});
