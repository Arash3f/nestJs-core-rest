/* eslint-disable */
/* tslint:disable */
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

export interface LoginOutput {
  jwt: string;
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

export interface CreateUserInput {
  name: string;
  username: string;
  password: string;
  role: "Admin" | "Member";
}

export interface ReadUserWhereData {
  id?: string;
  username?: string;
  name?: string;
  role?: "Admin" | "Member";
  active?: boolean;
}

export interface PaginationData {
  /**
   * @min 0
   * @max 200
   * @default 10
   */
  take?: number;
  /** @min 0 */
  skip?: number;
}

export interface SortByData {
  field?: string;
  /** @default true */
  descending?: boolean;
}

export interface ReadUserInput {
  where?: ReadUserWhereData;
  pagination?: PaginationData;
  sortBy?: SortByData;
}

export interface ReadUserOutput {
  count: number;
  data: UserModel[];
}

export interface IdInput {
  id: string;
}

export interface UpdateUserDataInput {
  username: string;
  active: boolean;
  role?: "Admin" | "Member";
  name: string;
}

export interface UpdateUserInput {
  where?: IdInput;
  data?: UpdateUserDataInput;
}

export interface SuccessOutput {
  success: boolean;
}

export interface ChangePasswordDataInput {
  newPassword: string;
}

export interface ChangePasswordInput {
  where: IdInput;
  data: ChangePasswordDataInput;
}

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
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

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
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

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "" });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
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
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
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

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title My Project APIs
 * @version 1.0
 * @contact
 *
 * The Project APIs description
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * @description Takes the user's information and after validate the information returns the user's jwt Token
     *
     * @tags Auth
     * @name LogIn
     * @summary Login user
     * @request POST:/auth/logIn
     */
    logIn: (data: LoginInput, params: RequestParams = {}) =>
      this.request<
        LoginOutput,
        {
          /** @example {"code":6,"module":"AuthModule","message":"The username or password is incorrect","persianTranslation":"نام کاربری یا پسورد اشتباه است","statusCode":400} */
          "0": object;
        }
      >({
        path: `/auth/logIn`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description return the requester informations by requester Token
     *
     * @tags Auth
     * @name Me
     * @summary Get my information
     * @request GET:/auth/me
     * @secure
     */
    me: (params: RequestParams = {}) =>
      this.request<
        UserModel,
        {
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "0": object;
        }
      >({
        path: `/auth/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes the user's information and after validate the information create new User
     *
     * @tags Auth
     * @name CreateUser
     * @summary Create new user
     * @request POST:/auth/createUser
     * @secure
     */
    createUser: (data: CreateUserInput, params: RequestParams = {}) =>
      this.request<
        UserModel,
        {
          /** @example {"code":3,"module":"AuthModule","message":"Username is duplicate","persianTranslation":"نام کاربری تکراری است","statusCode":400} */
          "0": object;
          /** @example {"code":2,"module":"AuthModule","message":"Access denied","persianTranslation":"دسترسی داده نشد","statusCode":400} */
          "1": object;
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "2": object;
        }
      >({
        path: `/auth/createUser`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes the information for search and sends the found items
     *
     * @tags Auth
     * @name ReadUsers
     * @summary Found users
     * @request POST:/auth/readUsers
     * @secure
     */
    readUsers: (data: ReadUserInput, params: RequestParams = {}) =>
      this.request<
        ReadUserOutput,
        {
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "0": object;
        }
      >({
        path: `/auth/readUsers`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes the necessary information for update user and sends the updated use
     *
     * @tags Auth
     * @name UpdateUser
     * @summary Updated user
     * @request POST:/auth/updateUser
     * @secure
     */
    updateUser: (data: UpdateUserInput, params: RequestParams = {}) =>
      this.request<
        UserModel,
        {
          /** @example {"code":4,"module":"AuthModule","message":"User not found","persianTranslation":"کاربر پیدا نشد","statusCode":400} */
          "0": object;
          /** @example {"code":3,"module":"AuthModule","message":"Username is duplicate","persianTranslation":"نام کاربری تکراری است","statusCode":400} */
          "1": object;
          /** @example {"code":2,"module":"AuthModule","message":"Access denied","persianTranslation":"دسترسی داده نشد","statusCode":400} */
          "2": object;
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "3": object;
        }
      >({
        path: `/auth/updateUser`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Take the information for find user and delete it
     *
     * @tags Auth
     * @name DeleteUser
     * @summary Delete user
     * @request DELETE:/auth/deleteUser
     * @secure
     */
    deleteUser: (data: IdInput, params: RequestParams = {}) =>
      this.request<
        SuccessOutput,
        {
          /** @example {"code":4,"module":"AuthModule","message":"User not found","persianTranslation":"کاربر پیدا نشد","statusCode":400} */
          "0": object;
          /** @example {"code":2,"module":"AuthModule","message":"Access denied","persianTranslation":"دسترسی داده نشد","statusCode":400} */
          "1": object;
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "2": object;
        }
      >({
        path: `/auth/deleteUser`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Take the information for find user and update password
     *
     * @tags Auth
     * @name ChangePassword
     * @summary Update user password
     * @request POST:/auth/changePassword
     * @secure
     */
    changePassword: (data: ChangePasswordInput, params: RequestParams = {}) =>
      this.request<
        SuccessOutput,
        {
          /** @example {"code":4,"module":"AuthModule","message":"User not found","persianTranslation":"کاربر پیدا نشد","statusCode":400} */
          "0": object;
          /** @example {"code":2,"module":"AuthModule","message":"Access denied","persianTranslation":"دسترسی داده نشد","statusCode":400} */
          "1": object;
          /** @example {"code":1,"module":"AuthModule","message":"User is not authorized","persianTranslation":"ابتدا وارد شوید","statusCode":400} */
          "2": object;
        }
      >({
        path: `/auth/changePassword`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
