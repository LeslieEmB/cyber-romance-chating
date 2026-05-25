"use client";

import { useEffect, useState } from "react";
import { Download, RotateCcw, Server, Shield, Trash2 } from "lucide-react";
import { usePersonaStore } from "@/stores/personaStore";

type ApiStatus = {
  configured: boolean;
  baseUrl: string;
  model: string;
};

export function SettingsPanel() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const persona = usePersonaStore((state) => state.persona);
  const memories = usePersonaStore((state) => state.memories);
  const messages = usePersonaStore((state) => state.messages);
  const settings = usePersonaStore((state) => state.settings);
  const updateSettings = usePersonaStore((state) => state.updateSettings);
  const clearChat = usePersonaStore((state) => state.clearChat);
  const resetAll = usePersonaStore((state) => state.resetAll);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      const response = await fetch("/api/status");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as ApiStatus;
      if (active) {
        setApiStatus(data);
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  function exportData() {
    const payload = JSON.stringify({ persona, memories, messages, settings }, null, 2);
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cyber-romance-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="workspace-grid settings-workspace">
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">SYSTEM SETTINGS</span>
            <h1>设置</h1>
          </div>
          <span className="save-state">
            <Server size={16} />
            DeepSeek
          </span>
        </header>

        <div className="settings-stack">
          <section className="settings-section">
            <div>
              <h2>模型连接</h2>
              <p>{settings.baseUrl}</p>
            </div>
            <div className="editor-grid">
              <label className="field-stack">
                <span>Base URL</span>
                <input value={settings.baseUrl} onChange={(event) => updateSettings({ baseUrl: event.target.value })} />
              </label>
              <label className="field-stack">
                <span>模型</span>
                <input value={settings.model} onChange={(event) => updateSettings({ model: event.target.value })} />
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div>
              <h2>隐私</h2>
              <p>{settings.privacyMode ? "隐私模式开启" : "本地记忆开启"}</p>
            </div>
            <label className="toggle-row">
              <span>
                <Shield size={17} />
                本地记忆
              </span>
              <input
                type="checkbox"
                checked={settings.localMemory}
                onChange={(event) => updateSettings({ localMemory: event.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>
                <Shield size={17} />
                隐私模式
              </span>
              <input
                type="checkbox"
                checked={settings.privacyMode}
                onChange={(event) => updateSettings({ privacyMode: event.target.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>
                <Server size={17} />
                流式响应
              </span>
              <input
                type="checkbox"
                checked={settings.stream}
                onChange={(event) => updateSettings({ stream: event.target.checked })}
              />
            </label>
          </section>

          <section className="settings-section action-section">
            <button className="secondary-action" type="button" onClick={exportData}>
              <Download size={17} />
              导出数据
            </button>
            <button className="secondary-action danger" type="button" onClick={clearChat}>
              <Trash2 size={17} />
              清空聊天
            </button>
            <button className="secondary-action danger" type="button" onClick={resetAll}>
              <RotateCcw size={17} />
              重置全部
            </button>
          </section>
        </div>
      </div>

      <aside className="workspace-side">
        <div className="side-readout">
          <span className="eyebrow">API ADAPTER</span>
          <h2>{apiStatus?.configured ? "DeepSeek 已配置" : "本地后端模拟中"}</h2>
          <p>
            {apiStatus?.configured
              ? `当前模型：${apiStatus.model}`
              : "未检测到 DEEPSEEK_API_KEY，聊天接口会走本地后端模拟。"}
          </p>
          <p>{apiStatus?.baseUrl ?? settings.baseUrl}</p>
        </div>
      </aside>
    </section>
  );
}
