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

export interface LoginInput {
  username: string;
  password: string;
}

export interface AppExceptionResponseDto {
  /** HTTP status code */
  statusCode: number;
  /** Error message in English */
  message: string;
  /** Error message in Persian */
  persianTranslation: string;
  /** Detailed error message for developers */
  developerMessage?: string;
  /** Module special error code */
  code: number;
  /** Module where error occurred */
  module:
    | "AppModule"
    | "AuthModule"
    | "ConfigModule"
    | "InitModule"
    | "PrismaModule"
    | "UserModule";
  /**
   * Timestamp of the error
   * @example "2024-01-01T10:00:00.000Z"
   */
  timestamp: string;
  /** Request path */
  path: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  name: string;
  username: string;
  /**
   * @minLength 8
   * @maxLength 128
   */
  password: string;
}

export interface SuccessOutput {
  success: boolean;
}

export interface IdInput {
  id: string;
}

export interface ChangePasswordDataInput {
  /**
   * @minLength 8
   * @maxLength 128
   */
  newPassword: string;
}

export interface ChangePasswordInput {
  where: IdInput;
  data: ChangePasswordDataInput;
}

export interface ChangeMyPasswordInput {
  currentPassword: string;
  /**
   * @minLength 8
   * @maxLength 128
   */
  newPassword: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export interface UserModel {
  id: string;
  name: string;
  username: string;
  active: boolean;
  role: "Admin" | "Member";
  /** @format date-time */
  createdDate: string;
  /** @format date-time */
  updatedDate: string;
}

export interface UpdateMeInput {
  name?: string;
  username?: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
  /**
   * @minLength 8
   * @maxLength 128
   */
  password: string;
  role: "Admin" | "Member";
}

export interface ReadUserOutput {
  count: number;
  data: UserModel[];
}

export interface UpdateUserDataInput {
  username?: string;
  active?: boolean;
  role?: "Admin" | "Member";
  name?: string;
}

export interface UpdateUserInput {
  where: IdInput;
  data: UpdateUserDataInput;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title NestJS Core Rest
 * @version 1.0
 * @contact
 *
 * Production-grade NestJS REST API boilerplate
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name LogIn
     * @summary Login user
     * @request POST:/auth/logIn
     */
    logIn: (data: LoginInput, params: RequestParams = {}) =>
      this.request<any, AppExceptionResponseDto | LoginOutput>({
        path: `/auth/logIn`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Public self-registration. Always creates a Member and returns tokens (auto-login).
     *
     * @tags Auth
     * @name Register
     * @summary Register a new member account
     * @request POST:/auth/register
     */
    register: (data: RegisterInput, params: RequestParams = {}) =>
      this.request<LoginOutput, AppExceptionResponseDto>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Logout
     * @summary logout user
     * @request POST:/auth/logout
     */
    logout: (params: RequestParams = {}) =>
      this.request<any, SuccessOutput>({
        path: `/auth/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ChangePassword
     * @summary Update user password
     * @request PATCH:/auth/changePassword
     */
    changePassword: (data: ChangePasswordInput, params: RequestParams = {}) =>
      this.request<SuccessOutput, AppExceptionResponseDto>({
        path: `/auth/changePassword`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Self-service password change. Requires the current password before applying the new one.
     *
     * @tags Auth
     * @name ChangeMyPassword
     * @summary Change the current user's password
     * @request PATCH:/auth/changeMyPassword
     */
    changeMyPassword: (
      data: ChangeMyPasswordInput,
      params: RequestParams = {},
    ) =>
      this.request<SuccessOutput, AppExceptionResponseDto>({
        path: `/auth/changeMyPassword`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RefreshToken
     * @summary refresh token
     * @request POST:/auth/refreshToken
     */
    refreshToken: (data: RefreshTokenInput, params: RequestParams = {}) =>
      this.request<RefreshTokenOutput, AppExceptionResponseDto>({
        path: `/auth/refreshToken`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description return the requester informations by requester Token
     *
     * @tags User
     * @name Me
     * @summary Get my information
     * @request GET:/user/me
     */
    me: (params: RequestParams = {}) =>
      this.request<UserModel, AppExceptionResponseDto>({
        path: `/user/me`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Lets any logged-in user update their own name/username (not role or active).
     *
     * @tags User
     * @name UpdateMe
     * @summary Update my own profile
     * @request POST:/user/updateMe
     */
    updateMe: (data: UpdateMeInput, params: RequestParams = {}) =>
      this.request<UserModel, AppExceptionResponseDto>({
        path: `/user/updateMe`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes the user's information and after validate the information create new User
     *
     * @tags User
     * @name CreateUser
     * @summary Create new user
     * @request POST:/user/createUser
     */
    createUser: (data: CreateUserInput, params: RequestParams = {}) =>
      this.request<UserModel, AppExceptionResponseDto>({
        path: `/user/createUser`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns users matching the optional query filters, with pagination and sorting.
     *
     * @tags User
     * @name ReadUsers
     * @summary List users
     * @request GET:/user
     */
    readUsers: (
      query?: {
        id?: string;
        username?: string;
        name?: string;
        role?: "Admin" | "Member";
        active?: boolean;
        /**
         * @min 0
         * @max 200
         * @default 10
         */
        take?: number;
        /**
         * @min 0
         * @default 0
         */
        skip?: number;
        sortField?: string;
        /** @default true */
        sortDescending?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ReadUserOutput, any>({
        path: `/user`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes the necessary information for update user and sends the updated use
     *
     * @tags User
     * @name UpdateUser
     * @summary Updated user
     * @request POST:/user/updateUser
     */
    updateUser: (data: UpdateUserInput, params: RequestParams = {}) =>
      this.request<UserModel, AppExceptionResponseDto>({
        path: `/user/updateUser`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Soft-deletes the user identified by the path id (sets active to false).
     *
     * @tags User
     * @name DeleteUser
     * @summary Delete user
     * @request DELETE:/user/{id}
     */
    deleteUser: (id: string, params: RequestParams = {}) =>
      this.request<SuccessOutput, AppExceptionResponseDto>({
        path: `/user/${id}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),
  };
  health = {
    /**
     * No description
     *
     * @tags Health
     * @name Health
     * @summary Health check
     * @request GET:/health
     */
    health: (params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/health`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
