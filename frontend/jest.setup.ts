import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom lacks fetch, Request, Response, AbortController — polyfill them.
if (!global.fetch) {
  global.fetch = jest.fn() as unknown as typeof fetch;
}
if (!global.Request) {
  // Minimal Request polyfill (only used for type checks in next).
  global.Request = class Request {
    constructor(
      public input: string | URL,
      public init?: RequestInit,
    ) {}
  } as unknown as typeof Request;
}
if (!global.Response) {
  global.Response = class Response {
    constructor(
      public body: unknown,
      public init?: ResponseInit,
    ) {}
  } as unknown as typeof Response;
}
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
if (!global.AbortController) {
  global.AbortController = class AbortController {
    signal = { aborted: false } as AbortSignal;
    abort() {}
  } as unknown as typeof AbortController;
}
