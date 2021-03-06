/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isDocumentReady, onDocumentReady, whenDocumentReady,} from
    '../../src/document-ready';
import {timer} from '../../src/timer';
import * as sinon from 'sinon';


describe('documentReady', () => {

  let testDoc;
  let eventListeners;

  beforeEach(() => {
    eventListeners = {};
    testDoc = {
      readyState: 'loading',
      addEventListener: (eventType, handler) => {
        eventListeners[eventType] = handler;
      },
      removeEventListener: (eventType, handler) => {
        if (eventListeners[eventType] == handler) {
          delete eventListeners[eventType];
        }
      },
    };
  });

  it('should interprete readyState correctly', () => {
    expect(isDocumentReady(testDoc)).to.equal(false);

    testDoc.readyState = 'interactive';
    expect(isDocumentReady(testDoc)).to.equal(true);

    testDoc.readyState = 'complete';
    expect(isDocumentReady(testDoc)).to.equal(true);
  });

  it('should call callback immediately when ready', () => {
    testDoc.readyState = 'complete';
    const callback = sinon.spy();
    onDocumentReady(testDoc, callback);
    expect(callback.callCount).to.equal(1);
  });

  it('should wait to call callback until ready', () => {
    testDoc.readyState = 'loading';
    const callback = sinon.spy();
    onDocumentReady(testDoc, callback);
    expect(callback.callCount).to.equal(0);
    expect(eventListeners['readystatechange']).to.not.equal(undefined);

    // Complete
    testDoc.readyState = 'complete';
    eventListeners['readystatechange']();
    expect(callback.callCount).to.equal(1);
    expect(eventListeners['readystatechange']).to.equal(undefined);
  });

  it('should wait to call callback for several loading events', () => {
    testDoc.readyState = 'loading';
    const callback = sinon.spy();
    onDocumentReady(testDoc, callback);
    expect(callback.callCount).to.equal(0);
    expect(eventListeners['readystatechange']).to.not.equal(undefined);

    // Still loading
    eventListeners['readystatechange']();
    expect(callback.callCount).to.equal(0);
    expect(eventListeners['readystatechange']).to.not.equal(undefined);

    // Complete
    testDoc.readyState = 'complete';
    eventListeners['readystatechange']();
    expect(callback.callCount).to.equal(1);
    expect(eventListeners['readystatechange']).to.equal(undefined);
  });

  describe('whenDocumentReady', () => {

    it('should call callback immediately when ready', () => {
      testDoc.readyState = 'complete';
      const spy = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();

      whenDocumentReady(testDoc).then(spy).then(spy2);

      whenDocumentReady(testDoc).then(spy3);

      expect(spy.callCount).to.equal(0);
      expect(spy2.callCount).to.equal(0);
      expect(spy3.callCount).to.equal(0);

      return timer.promise().then(() => {
        expect(spy.callCount).to.equal(1);
        expect(spy2.callCount).to.equal(1);
        expect(spy3.callCount).to.equal(1);
      });
    });

    it('should not call callback', () => {
      const spy = sinon.spy();
      whenDocumentReady(testDoc).then(spy);
      expect(spy.callCount).to.equal(0);
      return timer.promise().then(() => {
        expect(spy.callCount).to.equal(0);
      });
    });

    it('should wait to call callback until ready', () => {
      testDoc.readyState = 'loading';
      const callback = sinon.spy();
      whenDocumentReady(testDoc).then(callback);

      return timer.promise().then(() => {
        expect(callback.callCount).to.equal(0);
        expect(eventListeners['readystatechange']).to.not.equal(undefined);

        // Complete
        testDoc.readyState = 'complete';
        eventListeners['readystatechange']();

        return timer.promise().then(() => {
          expect(callback.callCount).to.equal(1);
          expect(eventListeners['readystatechange']).to.equal(undefined);
        });
      });
    });
  });
});
