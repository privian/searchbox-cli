import { jest } from '@jest/globals';
import got from 'got';
import nock from 'nock';
import { Runner } from '../runner';
import { BaseAdapter } from './base.adapter';
import { HttpAdapter } from './http.adapter';

describe('HttpAdapter', () => {
  describe('.getOptions()', () => {
    test('should return an object with default options', () => {
      const result = HttpAdapter.getOptions();
      expect(result).toEqual({
        checkUrl: null,
        delay: 0,
        follow: true,
        maxDepth: 10,
        maxPages: 1000,
        request: {
          method: 'GET',
          timeout: {
            request: 20000,
          },
        },
      });
    });

    test('should merge custom options with defaults', () => {
      const result = HttpAdapter.getOptions({
        follow: false,
        maxDepth: 1,
        maxPages: 100,
        request: {
          timeout: {
            request: 5000,
          },
        },
      });
      expect(result).toEqual({
        checkUrl: null,
        delay: 0,
        follow: false,
        maxDepth: 1,
        maxPages: 100,
        request: {
          method: 'GET',
          timeout: {
            request: 5000,
          },
        },
      });
    });
  });

  describe('constructor', () => {
    let runner: Runner;
    let instance: HttpAdapter;

    beforeAll(() => {
      runner = new Runner({
        manifest: 'test.manifest.json',
        uri: '/test',
      });
    });

    beforeEach(() => {
      instance = new HttpAdapter(runner);
    });

    test('should extend BaseAdater', () => {
      expect(instance).toBeInstanceOf(BaseAdapter);
    });

    describe('.success()', () => {
      test('should push successful result', () => {
        const uri = '/test';
        const section = {
          title: 'test',
        };
        instance.success([section], uri, 100);
        expect(instance.processed.has(uri)).toBeTruthy();
        expect(instance.sections.has(section)).toBeTruthy();
      });
    });

    describe('.failure()', () => {
      test('should push unsuccessful result', () => {
        const uri = '/test';
        instance.failure(uri, 500, 100);
        expect(instance.processed.has(uri)).toBeTruthy();
      });
    });

    describe('.request()', () => {
      test('should make call got', () => {
        const spy = jest.spyOn(got, 'get');
        nock('https://example').get('/').reply(200);
        return instance.request('https://example').then(({ body }) => {
          expect(spy).toHaveBeenLastCalledWith('https://example', {
            method: 'GET',
            throwHttpErrors: false,
            timeout: {
              request: 20000,
            },
          });
        });
      });
    });
  });
});
