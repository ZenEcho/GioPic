import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';


const HttpRequest = axios.create();

HttpRequest.interceptors.request.use(function (config: AxiosRequestConfig) {
    // 获取传入的配置信息，要求调用时在 config 中传入 programConfiguration 属性

    const result = config.programConfiguration;
    // 如果没有配置信息，则直接返回
    if (!result) return config as InternalAxiosRequestConfig;

    let CorsProxy = result.CorsProxy ? result.Cors || "" : "";
    if (CorsProxy) {
        if (!CorsProxy.endsWith('/')) {
            CorsProxy += '/';
        }
        const isAbsoluteURL = /^http?:\/\//i.test(config.url || '');
        const originalUrl = isAbsoluteURL ? config.url : `${config.baseURL || ''}${config.url}`;
        config.url = `${CorsProxy}${originalUrl}`;
    }
    return config as InternalAxiosRequestConfig;
}, function (error) {
    return Promise.reject(error);
});

export default HttpRequest;