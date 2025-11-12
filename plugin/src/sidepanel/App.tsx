import { useState, useEffect, useRef } from "react";
import {
  Save,
  Server,
  RefreshCw,
  Undo2,
  Globe2,
  Loader2,
  WifiOff,
} from "lucide-react";
import { ProxyMode, defaultSettings } from "@/common/config";

import React from "react";
import { formatInterval } from "@/common/util";


/**
 * 显示代理连接间隔的易读格式的组件
 * @param interval 分钟数
 * @returns 形如 "1 年 2 月 3 日 4 小时 5 分钟" 的字符串
 */
export const IntervalLabel: React.FC<{ interval: number }> = ({ interval }) => {

  if (!interval) {
    return <IntervalLabel interval={defaultSettings.interval} />;
  }

  return (
    <label className="font-medium text-gray-700">
      自动检测代理连接（每 {formatInterval(interval)}）
    </label>
  );
};

export default function SidePanel() {
  const [server, setServer] = useState("");
  const [interval, setIntervalValue] = useState(5);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [proxyInfo, setProxyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /** ✅ 初始化加载设置并监听 background */
  useEffect(() => {
    chrome.storage.sync.get(["server", "autoReconnect", "interval"], (data) => {
      setServer(data.server || defaultSettings.server);
      setIntervalValue(data.interval || defaultSettings.interval);
      setAutoReconnect(data.autoReconnect || defaultSettings.autoReconnect);
    });

    // 监听 background 状态更新
    const listener = (message: any) => {
      if (message.type === "PROXY_STATUS_UPDATE") {
        setProxyInfo(message.payload);
        setLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  /** ✅ 刷新代理连接 */
  const reloadProxy = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "RELOAD_PROXY_CONFIG" });
  };

  /** ✅ 保存设置 */
  const save = async () => {
    if (!interval) {
      alert("⚠️ 请设置有效的检测间隔时间！");
      setIntervalValue(defaultSettings.interval);
    }
    await chrome.storage.sync.set({ server, autoReconnect, interval: interval || defaultSettings.interval, proxyMode: ProxyMode.SMART });
    chrome.runtime.sendMessage({ type: "UPDATE_PROXY_SETTINGS" });
    alert("✅ 设置已保存！");
  };

  /** ✅ 重置设置 */
  const reset = async () => {
    setServer(defaultSettings.server);
    setIntervalValue(defaultSettings.interval);
    setAutoReconnect(defaultSettings.autoReconnect);
    await chrome.storage.sync.set({
      ...defaultSettings,
      proxyMode: ProxyMode.SMART,
    });
    chrome.runtime.sendMessage({ type: "UPDATE_PROXY_SETTINGS" });
    alert("🔄 已恢复默认设置！");
  };

  return (
    <div className="p-6 w-full bg-gradient-to-b from-purple-50 to-white rounded-2xl shadow-lg text-gray-800 flex flex-col gap-5">
      {/* 标题 */}
      <h2 className="text-lg font-bold text-merchantPurple flex items-center gap-2">
        <Server className="text-merchantPurple" size={24} /> 代理设置
      </h2>

      {/* 代理服务器地址 */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700">🌐 代理服务器地址：</label>
        <input
          type="text"
          value={server}
          onChange={(e) => setServer(e.target.value)}
          className="w-full p-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merchantPurple transition-all"
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
        <IntervalLabel interval={interval} />
      </div>

      {/* 自动重连间隔 */}
      <div className="flex flex-col gap-1">
        <label className="font-medium text-gray-700">
          ⏱️ 检测间隔（分钟）：
        </label>
        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => setIntervalValue(parseInt(e.target.value))}
          className="w-full p-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-merchantPurple transition-all"
        />
      </div>

      {/* 当前代理信息 */}
      <div className="mt-2 border-t pt-3">
        <h3 className="flex items-center gap-2 text-merchantPurple font-semibold mb-2">
          <Globe2 size={18} /> 当前连接信息
        </h3>

        <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 shadow-inner">
          {loading ? (
            <div className="flex items-center gap-2 text-purple-600">
              <Loader2 className="animate-spin" size={18} />
              正在检测连接...
            </div>
          ) : proxyInfo ? (
            proxyInfo.error ? (
              <div className="text-sm text-red-500 flex items-center gap-2">
                <WifiOff size={16} /> {proxyInfo.error}
              </div>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <div className="text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <strong>当前连接：{proxyInfo.isDefault ? "通过直连网络" : "通过代理服务器"}</strong>
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
              </div>
            )
          ) : (
            <div className="text-sm text-gray-400 italic">
              暂无连接信息，请点击下方刷新按钮。
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between mt-2">
        <button
          onClick={save}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-merchantPurple text-white rounded-xl shadow-glow hover:bg-merchantPurple-dark transition-all"
        >
          <Save size={18} /> 保存
        </button>
        <button
          onClick={reset}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all ml-2"
        >
          <Undo2 size={18} /> 重置
        </button>
        <button
          onClick={reloadProxy}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-100 text-merchantPurple rounded-xl hover:bg-purple-200 transition-all ml-2"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          刷新
        </button>
      </div>
    </div>
  );
}
