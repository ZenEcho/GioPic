import type { DriveType } from '@/types'

export interface FieldSchema {
  key: string
  label: string // i18n key or raw string
  type: 'text' | 'password' | 'number' | 'switch' | 'select' | 'textarea' | 'kv-pairs'
  placeholder?: string
  required?: boolean
  defaultValue?: any
  options?: { label: string; value: string }[]
  // If we need conditional visibility later, we can add `showIf: (model) => boolean`
}

export const COMMON_FIELDS: FieldSchema[] = [
  { key: 'path', label: 'config.form.path', type: 'text', placeholder: 'images/' },
  { key: 'customDomain', label: 'config.form.customDomain', type: 'text', placeholder: 'https://img.example.com' },
]

export const DRIVE_SCHEMAS: Record<string, FieldSchema[]> = {
  lsky: [
    { key: 'version', label: 'config.form.version', type: 'select', options: [{ label: 'V1', value: 'v1' }, { label: 'V2', value: 'v2' }], defaultValue: 'v1' },
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://example.com/api/v1/upload' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
    { key: 'strategyId', label: 'config.form.strategyId', type: 'select', placeholder: 'ID (V1为策略ID, V2为存储ID)' },
    { key: 'albumId', label: 'config.form.albumId', type: 'select', placeholder: '相册ID (可选)' },
    {
      key: 'permission',
      label: '是否公开',
      type: 'select',
      defaultValue: '0',
      options: [
        { label: '公开', value: '1' },
        { label: '私有', value: '0' }
      ]
    },
  ],
  easyimages: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://example.com/api/index.php' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
  ],
  chevereto: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://example.com/api/1/upload' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
    { key: 'albumId', label: 'config.form.albumId', type: 'text', placeholder: '相册ID (可选)' },
    {
      key: 'expiration',
      label: 'config.form.expiration',
      type: 'select',
      defaultValue: 'NODEL',
      options: [
        { value: "NONE", label: "不删除" },
        { value: "PT5M", label: "5分钟" },
        { value: "PT15M", label: "15分钟" },
        { value: "PT30M", label: "30分钟" },
        { value: "PT1H", label: "1小时" },
        { value: "PT3H", label: "3小时" },
        { value: "PT6H", label: "6小时" },
        { value: "PT12H", label: "12小时" },
        { value: "P1D", label: "1天" },
        { value: "P2D", label: "2天" },
        { value: "P3D", label: "3天" },
        { value: "P4D", label: "4天" },
        { value: "P5D", label: "5天" },
        { value: "P6D", label: "6天" },
        { value: "P1W", label: "1周" },
        { value: "P2W", label: "2周" },
        { value: "P3W", label: "3周" },
        { value: "P1M", label: "1个月" },
        { value: "P2M", label: "2个月" },
        { value: "P3M", label: "3个月" },
        { value: "P4M", label: "4个月" },
        { value: "P5M", label: "5个月" },
        { value: "P6M", label: "6个月" },
        { value: "P1Y", label: "1年" }
      ]
    },
    {
      key: 'nsfw',
      label: 'config.form.nsfw',
      type: 'select',
      defaultValue: '0',
      options: [
        { label: '否', value: '0' },
        { label: '是', value: '1' }
      ]
    },
  ],
  imgurl: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://imgurl.org' },
    { key: 'uid', label: 'config.form.uid', type: 'text', required: true },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
  ],
  smms: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', placeholder: 'https://sm.ms (默认为官方)', defaultValue: 'https://sm.ms/' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
  ],
  hellohao: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://example.com' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
    { key: 'source', label: 'config.form.source', type: 'text', required: true, placeholder: 'Source ID' },
  ],
  imgur: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', placeholder: 'https://api.imgur.com/3/upload (默认为官方)', defaultValue: 'https://api.imgur.com/3/upload/' },
    { key: 'token', label: 'Client ID', type: 'password', required: true },
  ],
  aliyun: [
    { key: 'endpoint', label: 'config.form.endpoint', type: 'text', required: true, placeholder: 'oss-cn-hangzhou.aliyuncs.com' },
    { key: 'bucket', label: 'config.form.bucket', type: 'text', required: true },
    { key: 'accessKeyId', label: 'config.form.accessKey', type: 'text', required: true },
    { key: 'accessKeySecret', label: 'config.form.secretKey', type: 'password', required: true },
    ...COMMON_FIELDS
  ],
  aws: [
    { key: 'endpoint', label: 'config.form.endpoint', type: 'text', placeholder: 's3.us-west-1.amazonaws.com' },
    { key: 'region', label: 'config.form.region', type: 'text', required: true, placeholder: 'us-west-1' },
    { key: 'bucket', label: 'config.form.bucket', type: 'text', required: true },
    { key: 'accessKeyId', label: 'config.form.accessKey', type: 'text', required: true },
    { key: 'secretAccessKey', label: 'config.form.secretKey', type: 'password', required: true },
    ...COMMON_FIELDS
  ],
  tencent: [
    { key: 'endpoint', label: 'config.form.endpoint', type: 'text', placeholder: '如果需要的话' },
    { key: 'region', label: 'config.form.region', type: 'text', required: true, placeholder: 'ap-guangzhou' },
    { key: 'bucket', label: 'config.form.bucket', type: 'text', required: true },
    { key: 'secretId', label: 'SecretId', type: 'text', required: true },
    { key: 'secretKey', label: 'config.form.secretKey', type: 'password', required: true },
    ...COMMON_FIELDS
  ],
  github: [
    { key: 'repo', label: 'config.form.repo', type: 'text', required: true, placeholder: 'username/repo' },
    { key: 'branch', label: 'config.form.branch', type: 'text', required: true, defaultValue: 'main', placeholder: 'main' },
    { key: 'token', label: 'config.form.token', type: 'password', required: true },
    ...COMMON_FIELDS
  ],
  custom: [
    { key: 'apiUrl', label: 'config.form.apiUrl', type: 'text', required: true, placeholder: 'https://api.example.com/upload' },
    { 
      key: 'method', 
      label: 'config.form.method', 
      type: 'select', 
      defaultValue: 'POST',
      options: [{ label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }]
    },
    { 
      key: 'uploadFormat', 
      label: 'config.form.uploadFormat', 
      type: 'select', 
      defaultValue: 'formData',
      options: [{ label: 'FormData', value: 'formData' }, { label: 'JSON (Base64)', value: 'json' }]
    },
    { key: 'fileParamName', label: 'config.form.fileParamName', type: 'text', defaultValue: 'file', required: true },
    { key: 'headers', label: 'config.form.headers', type: 'kv-pairs', placeholder: 'Header' },
    { key: 'bodyParams', label: 'config.form.bodyParams', type: 'kv-pairs', placeholder: 'Body' },
    { key: 'queryParams', label: 'URL参数 (Params)', type: 'kv-pairs', placeholder: 'Query' },
    { key: 'responseUrlPath', label: 'config.form.responseUrlPath', type: 'text', required: true, placeholder: 'data.url' },
  ]

}

export const DRIVE_TYPE_OPTIONS = [
  { label: 'Lsky Pro', value: 'lsky' },
  { label: 'EasyImages', value: 'easyimages' },
  { label: 'Chevereto', value: 'chevereto' },
  { label: 'ImgURL', value: 'imgurl' },
  { label: 'Hellohao', value: 'hellohao' },
  { label: 'SM.MS', value: 'smms' },
  { label: 'Imgur', value: 'imgur' },
  { label: 'GitHub', value: 'github' },
  { label: 'Custom', value: 'custom' },
  { label: 'Aliyun OSS', value: 'aliyun' },
  { label: 'Tencent COS', value: 'tencent' },
  { label: 'AWS S3', value: 'aws' },
]
