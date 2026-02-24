import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipUnwrap?: boolean;
  }
}
