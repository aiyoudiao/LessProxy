import React, { useState, useEffect } from "react";
import { Save, Server, RefreshCw, Zap } from "lucide-react";

export default function SidePanel() {
  const [server, setServer] = useState("");
  const [interval, setInterval] = useState(5);
  const [autoReconnect, setAutoReconnect] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(
      ["server", "autoReconnect", "interval"],
      (data) => {
        setServer(data.server || "https://your-proxy-config.com/pac.js");
        setInterval(data.interval || 5);
        setAutoReconnect(data.autoReconnect || false);
      }
    );
  }, []);

  const save = () => {
    chrome.storage.sync.set({ server, autoReconnect, interval });
    alert("设置已保存 ✅");
  };

  return (
    <div className="p-6 w-80 bg-white rounded-2xl shadow-lg text-gray-800 flex flex-col gap-4">
      {/* 标题 */}
      <h2 className="text-2xl font-bold text-merchantPurple flex items-center gap-2">
        <Server size={24} /> 代理设置
      </h2>

      {/* 代理服务器地址 */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700">代理服务器地址：</label>
        <input
          type="text"
          value={server}
          onChange={(e) => setServer(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-merchantPurple"
        />
      </div>

      {/* 自动代理重连 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={autoReconnect}
          onChange={(e) => setAutoReconnect(e.target.checked)}
          className="w-5 h-5 accent-merchantPurple"
        />
        <label className="font-medium text-gray-700">自动代理重连</label>
      </div>

      {/* 自动重连间隔 */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700">自动重连间隔（分钟）：</label>
        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-merchantPurple"
        />
      </div>

      {/* 保存按钮 */}
      <button
        onClick={save}
        className="mt-2 flex items-center justify-center gap-2 p-3 bg-merchantPurple text-white rounded-xl shadow-glow hover:bg-merchantPurple-dark transition-all"
      >
        <Save size={18} /> 保存设置
      </button>
    </div>
  );
}
