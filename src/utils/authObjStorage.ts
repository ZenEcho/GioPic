
import COS from 'cos-js-sdk-v5';
import OSS from 'ali-oss';
import { S3Client } from "@aws-sdk/client-s3";
import type { ConfigResponse } from '@/type';
import { wrapUrl } from '@/utils/main'


export const COS_Client = async (ConfigResponse: ConfigResponse) => {
    const config = ConfigResponse.data;
    try {
        return new COS({
            Protocol: 'https:',
            Domain: config.Endpoint,
            getAuthorization: function (options: any, callback: any) {
                if (!config.SecretId || !config.SecretKey) {
                    return { error: '缺少SecretId或SecretKey', message: `缺少SecretId或SecretKey`, type: "error" };
                }
                const authorization = COS.getAuthorization({
                    SecretId: config.SecretId,
                    SecretKey: config.SecretKey,
                    Method: options.Method,
                    Key: options.Key
                });
                callback(authorization);
            }
        });
    } catch (error) {
        return { error: error, message: "腾讯云对象存储,初始化失败！", type: "error" };
    }

}
export const OSS_Client = async (ConfigResponse: ConfigResponse) => {
    const config = ConfigResponse.data;
    try {
        if (!config.SecretId || !config.SecretKey) {
            return { error: '缺少SecretId或SecretKey', message: `缺少SecretId或SecretKey`, type: "error" };
        }
        return new OSS({
            accessKeyId: config.SecretId,
            accessKeySecret: config.SecretKey,
            bucket: config.Bucket,
            endpoint: config.Endpoint,
            region: config.Region,
            secure: true //强制https
        });
    } catch (error) {
        return { error: error, message: "阿里云对象存储,初始化失败！", type: "error" };
    }
}
export const S3_Client = async (ConfigResponse: ConfigResponse) => {
    const config = ConfigResponse.data;
    try {
        if (!config.SecretId || !config.SecretKey) {
            return { error: '缺少SecretId或SecretKey', message: `缺少SecretId或SecretKey`, type: "error" };
        }
        return new S3Client({
            region: config.Region,
            credentials: {
                accessKeyId: config.SecretId,
                secretAccessKey: config.SecretKey
            },
            endpoint: wrapUrl(config.Endpoint as string) || undefined, //当不是亚马逊存储时必须
        });

    } catch (error) {
        return { error: error, message: `S3对象存储,初始化失败！`, type: "error" };
    }
}