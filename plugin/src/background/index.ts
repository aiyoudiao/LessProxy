/**
 * background.ts
 * 插件后台主控制逻辑
 * - 管理代理模式切换
 * - 重新加载远程 PAC 配置
 * - 响应 Side Panel 打开请求
 * - 支持自动重连功能
 */

let globalThis: any = {};
const defaultPAC = `function FindProxyForURL(url, host) { return "DIRECT"; }`;

// ✅ 初始化：安装时启用 side panel
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "src/sidepanel/index.html",
    enabled: true,
  });
  console.log("[LessProxy] side panel 已注册");
});

// ✅ 监听 popup 或 sidepanel 发送的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 模式切换
  if (message.type === "MODE_CHANGE") {
    handleModeChange(message.mode);
  }

  // 手动重载代理配置
  if (message.type === "RELOAD_PROXY_CONFIG") {
    reloadProxyConfig();
  }

  //   // 从 popup 打开 sidepanel
  //   if (message.type === "OPEN_SIDEPANEL") {
  //     chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  //   }

  // if (message.type === "OPEN_SIDEPANEL") {
  //     chrome.windows.getCurrent({ populate: false }, (win) => {
  //         if (win && win.id !== undefined) {
  //         chrome.sidePanel.open({ windowId: win.id });
  //         } else {
  //         console.warn("[LessProxy] 无法获取当前窗口 ID，尝试打开默认 side panel");
  //         // Fallback: 直接设置默认启用
  //         chrome.sidePanel.setOptions({ enabled: true, path: "sidepanel.html" });
  //         }
  //     });
  // }

  // 从 sidepanel 保存设置后请求更新
  if (message.type === "UPDATE_PROXY_SETTINGS") {
    reloadProxyConfig();
  }

  sendResponse({ ok: true });
  return true;
});

/** ✅ 代理模式切换逻辑 */
function handleModeChange(mode: string) {
  if (mode === "direct") {
    chrome.proxy.settings.set(
      { value: { mode: "direct" }, scope: "regular" },
      () => console.log("[LessProxy] 已切换至直连模式")
    );
  } else if (mode === "smart") {
    chrome.proxy.settings.set(
      {
        value: {
          mode: "pac_script",
          pacScript: { data: globalThis.pacScript || defaultPAC },
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
    const url = server || "https://your-proxy-config.com/pac.js";
    const res = await fetch(url);
    const text = await res.text();
    globalThis.pacScript = text;
    console.log("[LessProxy] 代理配置已重新加载");
  } catch (err) {
    console.error("[LessProxy] 代理配置加载失败:", err);
  }
}

/** ✅ 自动重连逻辑 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoReloadProxy") {
    reloadProxyConfig();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoReconnect) {
    if (changes.autoReconnect.newValue) {
      chrome.storage.sync.get("interval", ({ interval }) => {
        chrome.alarms.create("autoReloadProxy", {
          periodInMinutes: interval || 5,
        });
        console.log("[LessProxy] 已开启自动重连任务");
      });
    } else {
      chrome.alarms.clear("autoReloadProxy");
      console.log("[LessProxy] 已关闭自动重连任务");
    }
  }
});
