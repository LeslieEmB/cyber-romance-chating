"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Download, Eye, EyeOff, KeyRound, RotateCcw, Server, Shield, Trash2 } from "lucide-react";
import { usePersonaStore } from "@/stores/personaStore";

type ApiStatus = {
  configured: boolean;
  connected: boolean;
  keyHint: string | null;
  baseUrl: string;
  model: string;
  source: "file" | "environment" | "none";
  error?: string;
};

export function SettingsPanel() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionState, setConnectionState] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
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

  async function testAndSaveConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectionState("testing");
    setConnectionMessage("");

    const response = await fetch("/api/provider/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, baseUrl: settings.baseUrl, model: settings.model })
    });
    const payload = (await response.json()) as ApiStatus;

    if (!response.ok) {
      setConnectionState("error");
      setConnectionMessage(payload.error || "连接失败，请检查填写信息。");
      return;
    }

    setApiStatus(payload);
    setApiKey("");
    setConnectionState("success");
    setConnectionMessage("已成功连接，新的聊天请求会使用该模型。");
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
          <form className="settings-section provider-editor" onSubmit={testAndSaveConnection}>
            <div>
              <h2>模型连接</h2>
              <p>配置只保存在本机服务中，页面不会回显完整密钥。</p>
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
              <label className="field-stack span-2">
                <span>DeepSeek API Key</span>
                <div className="secret-field">
                  <KeyRound size={17} />
                  <input
                    autoComplete="off"
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={apiStatus?.keyHint ? `已配置 ${apiStatus.keyHint}，输入新 Key 可替换` : "sk-..."}
                    required
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                  />
                  <button
                    className="password-toggle"
                    onClick={() => setShowApiKey((visible) => !visible)}
                    title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                    type="button"
                  >
                    {showApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            </div>
            <div className="provider-actions">
              <button className="primary-action compact" disabled={connectionState === "testing"} type="submit">
                <Server size={17} />
                {connectionState === "testing" ? "连接测试中..." : "测试并保存"}
              </button>
              {connectionState === "success" ? (
                <span className="provider-feedback is-success">
                  <CheckCircle2 size={17} />
                  {connectionMessage}
                </span>
              ) : null}
              {connectionState === "error" ? <span className="provider-feedback is-error">{connectionMessage}</span> : null}
            </div>
          </form>

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
              ? `当前模型：${apiStatus.model} / ${apiStatus.keyHint}`
              : "未检测到 DEEPSEEK_API_KEY，聊天接口会走本地后端模拟。"}
          </p>
          <p>{apiStatus?.baseUrl ?? settings.baseUrl}</p>
          {apiStatus?.source === "file" ? <p className="provider-source">本机设置页配置</p> : null}
        </div>
      </aside>
    </section>
  );
}
