/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface GetHealthzResponse {
  status: string;
}

export interface GetMeResponse {
  email: string;
  /** @format int64 */
  id: number;
  name: string;
  picture?: string | null;
}

export interface GetTodoResponse {
  completed: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format int64 */
  id: number;
  title: string;
  /** @format date-time */
  updatedAt: string;
  /** @format int64 */
  userId: number;
}

export interface GetTodosResponse {
  completed: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format int64 */
  id: number;
  title: string;
  /** @format date-time */
  updatedAt: string;
  /** @format int64 */
  userId: number;
}

export interface PostDevLoginResponse {
  email: string;
  /** @format int64 */
  id: number;
  name: string;
  picture?: string | null;
}

export interface PostGoogleRequest {
  /** フロントが `@react-oauth/google` で受け取った Google ID Token */
  idToken: string;
}

export interface PostGoogleResponse {
  email: string;
  /** @format int64 */
  id: number;
  name: string;
  picture?: string | null;
}

export interface PostTodoRequest {
  title: string;
}

export interface PostTodoResponse {
  completed: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format int64 */
  id: number;
  title: string;
  /** @format date-time */
  updatedAt: string;
  /** @format int64 */
  userId: number;
}

/** title / completed の **両方とも Option**。`Some` のフィールドだけ更新する。 */
export interface PutTodoRequest {
  completed?: boolean | null;
  title?: string | null;
}

export interface PutTodoResponse {
  completed: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format int64 */
  id: number;
  title: string;
  /** @format date-time */
  updatedAt: string;
  /** @format int64 */
  userId: number;
}

export interface GetTodosParams {
  /** `true` / `false` で完了状態に絞り込み。未指定で全件。 */
  completed?: boolean;
}

export interface GetTodoParams {
  /**
   * Todo の id
   * @format int64
   */
  id: number;
}

export interface PutTodoParams {
  /**
   * Todo の id
   * @format int64
   */
  id: number;
}

export interface DeleteTodoParams {
  /**
   * Todo の id
   * @format int64
   */
  id: number;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Todo Demo API
 * @version 0.1.0
 * @license
 *
 * Todo Demo の REST API。フロントの型生成元。
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  authApi = {
    /**
     * No description
     *
     * @tags authApi
     * @name PostDevLogin
     * @request POST:/auth-api/dev-login
     */
    postDevLogin: (params: RequestParams = {}) =>
      this.request<PostDevLoginResponse, void>({
        path: `/auth-api/dev-login`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags authApi
     * @name PostGoogle
     * @request POST:/auth-api/google
     */
    postGoogle: (data: PostGoogleRequest, params: RequestParams = {}) =>
      this.request<PostGoogleResponse, void>({
        path: `/auth-api/google`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags authApi
     * @name PostLogout
     * @summary セッション Cookie を削除して 204 を返す。
     * @request POST:/auth-api/logout
     */
    postLogout: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/auth-api/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags authApi
     * @name GetMe
     * @request GET:/auth-api/me
     */
    getMe: (params: RequestParams = {}) =>
      this.request<GetMeResponse, void>({
        path: `/auth-api/me`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  healthz = {
    /**
     * No description
     *
     * @tags system
     * @name GetHealthz
     * @summary ヘルスチェック。Phase 3 のロードバランサ / ヘルスチェッカーから叩かれる想定。
     * @request GET:/healthz
     */
    getHealthz: (params: RequestParams = {}) =>
      this.request<GetHealthzResponse, any>({
        path: `/healthz`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  todoApi = {
    /**
     * No description
     *
     * @tags todoApi
     * @name GetTodos
     * @request GET:/todo-api/todos
     */
    getTodos: (query: GetTodosParams, params: RequestParams = {}) =>
      this.request<GetTodosResponse[], void>({
        path: `/todo-api/todos`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags todoApi
     * @name PostTodo
     * @request POST:/todo-api/todos
     */
    postTodo: (data: PostTodoRequest, params: RequestParams = {}) =>
      this.request<PostTodoResponse, void>({
        path: `/todo-api/todos`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags todoApi
     * @name GetTodo
     * @request GET:/todo-api/todos/{id}
     */
    getTodo: ({ id }: GetTodoParams, params: RequestParams = {}) =>
      this.request<GetTodoResponse, void>({
        path: `/todo-api/todos/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags todoApi
     * @name PutTodo
     * @request PUT:/todo-api/todos/{id}
     */
    putTodo: (
      { id }: PutTodoParams,
      data: PutTodoRequest,
      params: RequestParams = {},
    ) =>
      this.request<PutTodoResponse, void>({
        path: `/todo-api/todos/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags todoApi
     * @name DeleteTodo
     * @request DELETE:/todo-api/todos/{id}
     */
    deleteTodo: ({ id }: DeleteTodoParams, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/todo-api/todos/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
}
