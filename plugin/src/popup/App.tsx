import { useState, useEffect } from "react";
import {
  Globe,
  Zap,
  RefreshCw,
  Settings,
  Wifi,
  Loader2,
  WifiOff,
} from "lucide-react";
import { ProxyMode } from "@/common/config";

const Popup = () => {
  const [mode, setMode] = useState(ProxyMode.DIRECT);
  const [loading, setLoading] = useState(false);
  const [proxyInfo, setProxyInfo] = useState<any>(null);

  useEffect(() => {
    console.log("[Popup] 启动");

    // 初始化代理
    chrome.runtime.sendMessage({ type: "INITIALIZE_PROXY" });

    chrome.storage.sync.get("proxyMode", (data) => {
      setMode(data.proxyMode || ProxyMode.DIRECT);
    });

    // ✅ 监听 background 发来的代理状态信息
    const listener = (message: any) => {
      if (message.type === "PROXY_STATUS_UPDATE") {
        setProxyInfo(message.payload);
        setLoading(false);
      }

      if (message.type === "MODE_CHANGE") {
        console.log("[Popup] 代理模式已更新为:", message.mode);
        setMode(message.mode);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleModeChange = (newMode: ProxyMode) => {
    setMode(newMode);
    chrome.storage.sync.set({ proxyMode: newMode });
    chrome.runtime.sendMessage({ type: "MODE_CHANGE", mode: newMode });
  };

  const reloadProxy = () => {
    handleModeChange(ProxyMode.SMART); // 切换模式时强制使用智能代理
    setLoading(true);
    chrome.runtime.sendMessage({ type: "RELOAD_PROXY_CONFIG" });
  };

  const openSidePanel = async () => {
    chrome.windows.getCurrent({ populate: false }, (win) => {
      if (win && win.id) {
        chrome.sidePanel.open({ windowId: win.id });
      }
    });
  };

  const checkConnection = async () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "CHECK_PROXY_STATUS" });
  };

  return (
    <div className="w-64 p-5 bg-gradient-to-b from-purple-50 to-white rounded-2xl shadow-xl text-gray-800 flex flex-col gap-3">
      {/* 标题 */}
      <h3 className="text-2xl font-bold text-merchantPurple text-center mb-2">
        LessProxy
      </h3>

      {/* 模式切换 */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => handleModeChange(ProxyMode.DIRECT)}
          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
            mode === ProxyMode.DIRECT
              ? "bg-merchantPurple text-white shadow-glow"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Globe size={18} />
          <span>全部直连</span>
        </button>

        <button
          onClick={() => handleModeChange(ProxyMode.SMART)}
          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
            mode === ProxyMode.SMART
              ? "bg-merchantPurple text-white shadow-glow"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Zap size={18} />
          <span>智能代理</span>
        </button>
      </div>

      {/* 分割线 */}
      <hr className="my-2 border-gray-200" />

      {/* 代理操作 */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={reloadProxy}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-100 text-merchantPurple hover:bg-purple-200 transition-all"
        >
          <RefreshCw size={18} />
          <span>刷新代理配置</span>
        </button>

        <button
          onClick={openSidePanel}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
        >
          <Settings size={18} />
          <span>打开设置面板</span>
        </button>

        <button
          onClick={checkConnection}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-merchantPurple transition-all"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Wifi size={18} />
          )}
          <span>{loading ? "检测中..." : "检测连接"}</span>
        </button>
      </div>

      {/* 当前代理信息 */}
      {proxyInfo && (
        <div className="mt-2 text-sm border-t border-purple-100 pt-2 text-gray-700">
          {proxyInfo.error ? (
            <div className="text-xs text-red-500 flex items-center gap-2">
              <WifiOff size={14} /> {proxyInfo.error}
            </div>
          ) : (
            <>
              <div className="text-green-500 font-semibold my-1">
                ✅ <strong>当前连接：</strong>{" "}
                {proxyInfo.isDefault ? "通过直连网络" : "通过代理服务器"}
              </div>
              <div>
                <strong>IP：</strong>
                {proxyInfo.query}
              </div>
              <div>
                <strong>ISP：</strong>
                {proxyInfo.isp}
              </div>
              <div>
                <strong>地区：</strong>
                {proxyInfo.country} - {proxyInfo.city}
              </div>
              <div>
                <strong>时区：</strong>
                {proxyInfo.timezone}
              </div>
              <div>
                <strong>代理商：</strong>
                {proxyInfo.as}
              </div>
            </>
          )}
        </div>
      )}

      {/* 底部版权 */}
      <footer className="text-[11px] text-gray-400 text-center mt-2">
        © 2025 LessProxy
      </footer>
    </div>
  );
};

export default Popup;
