/**
 * Wire types. These mirror https://responserift.dev exactly — see
 * docs/reference/api-contract.md. Do not add fields the API does not return.
 */

/** Every collection endpoint returns this wrapper. `total` is the count of ALL matches. */
export type Envelope<T> = {
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly results: readonly T[];
};

export type Contact = {
  readonly id: number;
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly avatar: string;
  readonly phone: string;
  readonly website: string;
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly zipcode: string;
  };
};

export type Post = {
  readonly id: number;
  readonly userId: number;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly category: string;
  readonly createdAt: string;
};

export type PageParams = {
  readonly limit: number;
  readonly offset: number;
};

export type SendMessageInput = {
  readonly userId: number;
  readonly title: string;
  readonly body: string;
};
