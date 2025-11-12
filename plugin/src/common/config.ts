/** 代理模式枚举 */
export enum ProxyMode {
  DIRECT = "direct",
  SMART = "smart",
}

/** URL 枚举 */
export enum UrlConfig {
  // pac 脚本连接 https://your-proxy-config.com/pac.js
  PAC_CONFIG_API = "https://your-proxy-config.com/pac.js",
  // ip api.com 用于检测当前 IP 和连接状态
  SERVER_STATUS_API = "http://ip-api.com/json",
}

/** 默认设置 */
export const defaultSettings = {
  server: UrlConfig.PAC_CONFIG_API,
  interval: 2 * 60,
  autoReconnect: true,
};
