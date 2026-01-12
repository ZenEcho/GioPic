// 检查当前环境
import { isDev } from '../manifest/utils'

console.log('当前环境:' + isDev + ', 是否开发环境:' + (isDev ? '是' : '否'))
