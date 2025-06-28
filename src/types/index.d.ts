
import type { AxiosRequestConfig } from 'axios';
import type { ProgramConfigurationType } from '@/type';

declare module 'axios' {
  export interface AxiosRequestConfig {
    programConfiguration?: ProgramConfigurationType;
  }
}

