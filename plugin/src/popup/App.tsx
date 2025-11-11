import React, { useState, useEffect } from "react";
import { Globe, Zap, RefreshCw, Settings } from "lucide-react";

const Popup = () => {
  const [mode, setMode] = useState("direct");

  useEffect(() => {
    chrome.storage.sync.get("proxyMode", (data) => {
      setMode(data.proxyMode || "direct");
    });
  }, []);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    chrome.storage.sync.set({ proxyMode: newMode });
    chrome.runtime.sendMessage({ type: "MODE_CHANGE", mode: newMode });
  };

  const reloadProxy = () => {
    chrome.runtime.sendMessage({ type: "RELOAD_PROXY_CONFIG" });
  };

  const openSidePanel = async () => {
    chrome.windows.getCurrent({ populate: false }, (win) => {
      if (win && win.id) {
        chrome.sidePanel.open({ windowId: win.id, });
      }
    });
  };

  return (
    <div className="w-60 p-4 bg-white rounded-2xl shadow-lg text-gray-800">
      {/* 标题 */}
      <h3 className="text-xl font-bold text-merchantPurple mb-3 text-center">
        LessProxy
      </h3>

      {/* 模式切换 */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => handleModeChange("direct")}
          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
            mode === "direct"
              ? "bg-merchantPurple text-white shadow-glow"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Globe size={18} />
          <span>全部直连</span>
        </button>

        <button
          onClick={() => handleModeChange("smart")}
          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
            mode === "smart"
              ? "bg-merchantPurple text-white shadow-glow"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Zap size={18} />
          <span>智能代理</span>
        </button>
      </div>

      {/* 分割线 */}
      <hr className="my-3 border-gray-200" />

      {/* 操作区 */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={reloadProxy}
          className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
        >
          <RefreshCw size={18} className="text-merchantPurple" />
          <span>代理重连</span>
        </button>

        <button
          onClick={openSidePanel}
          className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
        >
          <Settings size={18} className="text-merchantPurple" />
          <span>设置</span>
        </button>
      </div>

      {/* 底部版权 */}
      <footer className="text-[11px] text-gray-400 text-center mt-3">
        © 2025 LessProxy
      </footer>
    </div>
  );
};

export default Popup;
