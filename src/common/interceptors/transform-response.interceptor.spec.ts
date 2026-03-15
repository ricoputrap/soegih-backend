import { TransformResponseInterceptor } from './transform-response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor;
  let mockCtx: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformResponseInterceptor();
    mockCtx = {} as ExecutionContext;
  });

  it('should transform flat camelCase object to snake_case keys', (done) => {
    const input = {
      userId: '123',
      userName: 'John',
    };
    const expected = {
      user_id: '123',
      user_name: 'John',
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should recursively transform nested objects', (done) => {
    const input = {
      userId: '123',
      wallet: {
        walletId: 'w1',
        walletName: 'Cash',
      },
    };
    const expected = {
      user_id: '123',
      wallet: {
        wallet_id: 'w1',
        wallet_name: 'Cash',
      },
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should transform arrays of objects', (done) => {
    const input = [
      {
        userId: '123',
        userName: 'John',
      },
      {
        userId: '456',
        userName: 'Jane',
      },
    ];
    const expected = [
      {
        user_id: '123',
        user_name: 'John',
      },
      {
        user_id: '456',
        user_name: 'Jane',
      },
    ];

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should return null as-is', (done) => {
    mockCallHandler = { handle: () => of(null) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return undefined as-is', (done) => {
    mockCallHandler = { handle: () => of(undefined) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });

  it('should leave already-snake_case keys unchanged', (done) => {
    const input = {
      user_id: '123',
      user_name: 'John',
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(input);
      done();
    });
  });

  it('should preserve primitive values', (done) => {
    const input = 42;

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toBe(42);
      done();
    });
  });

  it('should handle deeply nested structures', (done) => {
    const input = {
      userId: '123',
      transaction: {
        transactionId: 't1',
        postings: [
          {
            postingId: 'p1',
            walletId: 'w1',
          },
        ],
      },
    };
    const expected = {
      user_id: '123',
      transaction: {
        transaction_id: 't1',
        postings: [
          {
            posting_id: 'p1',
            wallet_id: 'w1',
          },
        ],
      },
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should strip createdAt, updatedAt, deletedAt from camelCase objects', (done) => {
    const input = {
      userId: '123',
      userName: 'John',
      createdAt: '2026-03-15T10:00:00Z',
      updatedAt: '2026-03-15T11:00:00Z',
      deletedAt: null,
    };
    const expected = {
      user_id: '123',
      user_name: 'John',
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should strip created_at, updated_at, deleted_at from already-snake_case objects', (done) => {
    const input = {
      user_id: '123',
      user_name: 'John',
      created_at: '2026-03-15T10:00:00Z',
      updated_at: '2026-03-15T11:00:00Z',
      deleted_at: null,
    };
    const expected = {
      user_id: '123',
      user_name: 'John',
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });

  it('should strip timestamp fields recursively in nested objects and arrays', (done) => {
    const input = {
      userId: '123',
      createdAt: '2026-03-15T10:00:00Z',
      transaction: {
        transactionId: 't1',
        createdAt: '2026-03-15T10:30:00Z',
        updatedAt: '2026-03-15T11:00:00Z',
        postings: [
          {
            postingId: 'p1',
            walletId: 'w1',
            createdAt: '2026-03-15T10:35:00Z',
          },
          {
            postingId: 'p2',
            walletId: 'w2',
            updatedAt: '2026-03-15T11:05:00Z',
          },
        ],
      },
    };
    const expected = {
      user_id: '123',
      transaction: {
        transaction_id: 't1',
        postings: [
          {
            posting_id: 'p1',
            wallet_id: 'w1',
          },
          {
            posting_id: 'p2',
            wallet_id: 'w2',
          },
        ],
      },
    };

    mockCallHandler = { handle: () => of(input) } as CallHandler;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(expected);
      done();
    });
  });
});
