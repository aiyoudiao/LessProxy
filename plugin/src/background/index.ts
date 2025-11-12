/**
 * background.ts
 * 插件后台主控制逻辑
 * - 管理代理模式切换
 * - 重新加载远程 PAC 配置
 * - 响应 Side Panel 打开请求
 * - 支持自动重连功能
 */

import { defaultSettings, ProxyMode, UrlConfig } from "@/common/config";
import { formatInterval } from "@/common/util";

const defaultPAC = `function FindProxyForURL(url, host) { return "DIRECT"; }`;
let globalThis: any = { pacScript: defaultPAC };

// ✅ 初始化：安装时启用 side panel
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "src/sidepanel/index.html",
    enabled: true,
  });

  chrome.storage.sync.set({ proxyMode: ProxyMode.SMART, ...defaultSettings });

  console.log("[LessProxy] side panel 已注册");

  chrome.runtime.sendMessage({ type: "MODE_CHANGE", mode: ProxyMode.SMART });
});

// ✅ 启动时同步状态（Service Worker 重新唤醒）
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get("proxyMode", (data) => {
    if (!data.proxyMode) {
      chrome.storage.sync.set({ proxyMode: ProxyMode.SMART });
      console.log("[Startup] 已设置默认为智能代理模式");
    }
  });
});

// ✅ 监听 popup 或 sidepanel 发送的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // 初始化代理
  if (message.type === "INITIALIZE_PROXY") {
    if (globalThis.pacScript === defaultPAC) {
      reloadProxyConfig().then(() => {
        fetchProxyStatus();
      });
    }
  }

  // 模式切换
  if (message.type === "MODE_CHANGE") {
    handleModeChange(message.mode);
  }

  // 手动重载代理配置 | 从 sidepanel 保存设置后请求更新
  if (
    message.type === "RELOAD_PROXY_CONFIG" ||
    message.type === "UPDATE_PROXY_SETTINGS"
  ) {
    console.log("[LessProxy] 正在重新加载代理配置...");
    reloadProxyConfig().then(() => {
      fetchProxyStatus();
    });
  }

  // ✅ 新增：允许 popup 或 sidepanel 主动请求代理状态
  if (message.type === "CHECK_PROXY_STATUS") {
    fetchProxyStatus().then(() => sendResponse({ ok: true }));
    return true; // 保持异步
  }

  sendResponse({ ok: true });
  return true;
});

/** ✅ 代理模式切换逻辑 */
async function handleModeChange(mode: string) {
  if (mode === ProxyMode.DIRECT) {
    await chrome.proxy.settings.set(
      { value: { mode: ProxyMode.DIRECT }, scope: "regular" },
      () => console.log("[LessProxy] 已切换至直连模式")
    );
  } else if (mode === ProxyMode.SMART) {
    await chrome.proxy.settings.set(
      {
        value: {
          mode: "pac_script",
          pacScript: { data: globalThis.pacScript },
        },
        scope: "regular",
      },
      () => console.log("[LessProxy] 已切换至智能代理模式")
    );
  }
}

/** ✅ 拉取远程 PAC 配置 */
async function reloadProxyConfig() {
  try {
    const { server } = await chrome.storage.sync.get("server");
    console.log("[LessProxy] 代理服务器地址:", server);
    const url = server || UrlConfig.PAC_CONFIG_API;
    const res = await fetch(`${url}?now=${Date.now()}`);
    const text = await res.text();
    globalThis.pacScript = text;
    console.log("[LessProxy] 代理配置已重新加载");
  } catch (err) {
    console.error("[LessProxy] 代理配置加载失败:", err);
    globalThis.pacScript = defaultPAC; // 失败回退到默认连接
    chrome.runtime.sendMessage({
      type: "PROXY_STATUS_UPDATE",
      payload: { error: "加载失败，请检查网络或代理设置" },
    });
    throw err;
  } finally {
    await handleModeChange(ProxyMode.SMART);
    chrome.storage.sync.set({ proxyMode: ProxyMode.SMART });
    chrome.runtime.sendMessage({ type: "MODE_CHANGE", mode: ProxyMode.SMART });
  }
}

// ✅ 新增：请求当前代理出口信息
async function fetchProxyStatus() {
  try {
    const res = await fetch(UrlConfig.SERVER_STATUS_API);
    const data = await res.json();
    console.log("Proxy status:", data);

    // 把结果广播给 sidepanel
    chrome.runtime.sendMessage({
      type: "PROXY_STATUS_UPDATE",
      payload: {
        isDefault: globalThis.pacScript === defaultPAC,
        ...data,
      },
    });
  } catch (err) {
    chrome.runtime.sendMessage({
      type: "PROXY_STATUS_UPDATE",
      payload: { error: "检测失败，请检查网络或代理设置" },
    });
    console.error("Failed to fetch proxy status:", err);
  }
}

/** ✅ 自动重连逻辑 */
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("[LessProxy] 定时任务触发:", alarm.name);
  if (alarm.name === "autoReloadProxy") {
    reloadProxyConfig().then(() => {
      fetchProxyStatus();
    });
  }
});

chrome.storage.onChanged.addListener((changes: { [key: string]: any }) => {
  console.log("[LessProxy] 检测到设置变更:", changes);

  // 确保在非智能代理模式下关闭自动重连任务
  chrome.storage.sync.get(["proxyMode"], ({ proxyMode }) => {
    if (proxyMode === ProxyMode.SMART) {
      return;
    }

    console.log(
      "[LessProxy] 自动重连仅在智能代理模式下启用，当前模式无法启用自动重连任务。"
    );
    chrome.alarms.clear("autoReloadProxy");
    console.log("[LessProxy] 已关闭自动重连任务");
  });

  // 自动重连逻辑
  if (changes.autoReconnect) {
    if (changes.autoReconnect.newValue) {
      chrome.storage.sync.get(
        ["interval", "proxyMode"],
        ({ interval, proxyMode }) => {
          if (proxyMode !== ProxyMode.SMART) {
            console.log(
              "[LessProxy] 自动重连仅在智能代理模式下启用，当前模式无法启用自动重连任务。"
            );
            return;
          }
          chrome.alarms.clear("autoReloadProxy");
          chrome.alarms.create("autoReloadProxy", {
            periodInMinutes: interval || 5,
          });
          console.log(
            `🔁 已启用自动检测代理连接，每 ${formatInterval(
              interval
            )}检测一次。`
          );
          console.log("[LessProxy] 已开启自动重连任务");
        }
      );
    } else {
      chrome.alarms.clear("autoReloadProxy");
      console.log("[LessProxy] 已关闭自动重连任务");
    }
  }
});
