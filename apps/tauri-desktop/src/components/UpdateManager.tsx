import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { Download, RefreshCw, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UpdateInfo {
  version: string;
  release_date: string;
  download_url: string;
  signature: string;
  changelog: string;
  size: number;
  is_critical: boolean;
  min_version?: string;
}

interface UpdateConfig {
  auto_check: boolean;
  check_interval_hours: number;
  auto_download: boolean;
  auto_install: boolean;
  update_channel: 'Stable' | 'Beta' | 'Alpha';
  last_check?: number;
}

type UpdateStatus = 
  | 'CheckingForUpdates'
  | { UpdateAvailable: UpdateInfo }
  | 'NoUpdateAvailable'
  | { Downloading: { progress: number } }
  | 'Downloaded'
  | 'Installing'
  | 'Installed'
  | { Error: string };

export const UpdateManager: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus>('NoUpdateAvailable');
  const [config, setConfig] = useState<UpdateConfig>({
    auto_check: true,
    check_interval_hours: 24,
    auto_download: false,
    auto_install: false,
    update_channel: 'Stable',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    loadConfig();
    setupEventListeners();
  }, []);

  const loadConfig = async () => {
    try {
      const updateConfig = await invoke<UpdateConfig>('get_update_config');
      setConfig(updateConfig);
    } catch (error) {
      console.error('加载更新配置失败:', error);
    }
  };

  const setupEventListeners = async () => {
    // 监听更新状态变化
    const unlisten = await listen<UpdateStatus>('update-status', (event) => {
      setStatus(event.payload);
      if (event.payload === 'CheckingForUpdates') {
        setIsChecking(true);
      } else {
        setIsChecking(false);
      }
    });

    return () => {
      unlisten();
    };
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      const result = await invoke<UpdateStatus>('check_for_updates');
      setStatus(result);
    } catch (error) {
      console.error('检查更新失败:', error);
      setStatus({ Error: `检查更新失败: ${error}` });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadUpdate = async (updateInfo: UpdateInfo) => {
    try {
      await invoke('download_update', { updateInfo });
    } catch (error) {
      console.error('下载更新失败:', error);
      setStatus({ Error: `下载更新失败: ${error}` });
    }
  };

  const handleInstallUpdate = async (installerPath: string) => {
    try {
      await invoke('install_update', { installerPath });
    } catch (error) {
      console.error('安装更新失败:', error);
      setStatus({ Error: `安装更新失败: ${error}` });
    }
  };

  const handleConfigChange = async (newConfig: UpdateConfig) => {
    try {
      await invoke('update_update_config', { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('更新配置失败:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderUpdateStatus = () => {
    if (status === 'CheckingForUpdates') {
      return (
        <div className="update-status checking">
          <RefreshCw className="icon spinning" />
          <span>正在检查更新...</span>
        </div>
      );
    }

    if (status === 'NoUpdateAvailable') {
      return (
        <div className="update-status no-update">
          <CheckCircle className="icon" />
          <span>您使用的是最新版本</span>
        </div>
      );
    }

    if (typeof status === 'object' && 'UpdateAvailable' in status) {
      const updateInfo = status.UpdateAvailable;
      return (
        <div className="update-available">
          <div className="update-header">
            <AlertCircle className={`icon ${updateInfo.is_critical ? 'critical' : 'normal'}`} />
            <div>
              <h3>发现新版本 {updateInfo.version}</h3>
              <p className="release-date">发布日期: {updateInfo.release_date}</p>
            </div>
          </div>
          
          <div className="update-details">
            <div className="update-info">
              <span>大小: {formatFileSize(updateInfo.size)}</span>
              {updateInfo.is_critical && (
                <span className="critical-badge">重要更新</span>
              )}
            </div>
            
            <div className="changelog">
              <h4>更新内容:</h4>
              <div className="changelog-content">
                {updateInfo.changelog}
              </div>
            </div>
            
            <div className="update-actions">
              <button
                onClick={() => handleDownloadUpdate(updateInfo)}
                className="btn btn-primary"
              >
                <Download className="icon" />
                下载更新
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (typeof status === 'object' && 'Downloading' in status) {
      const progress = status.Downloading.progress;
      return (
        <div className="update-status downloading">
          <div className="download-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <span>正在下载更新...</span>
        </div>
      );
    }

    if (status === 'Downloaded') {
      return (
        <div className="update-status downloaded">
          <CheckCircle className="icon" />
          <span>更新已下载完成</span>
          <button
            onClick={() => handleInstallUpdate('')}
            className="btn btn-primary"
          >
            立即安装
          </button>
        </div>
      );
    }

    if (status === 'Installing') {
      return (
        <div className="update-status installing">
          <RefreshCw className="icon spinning" />
          <span>正在安装更新...</span>
        </div>
      );
    }

    if (status === 'Installed') {
      return (
        <div className="update-status installed">
          <CheckCircle className="icon" />
          <span>更新安装完成，请重启应用程序</span>
        </div>
      );
    }

    if (typeof status === 'object' && 'Error' in status) {
      return (
        <div className="update-status error">
          <X className="icon" />
          <span>更新失败: {status.Error}</span>
        </div>
      );
    }

    return null;
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="update-settings">
        <div className="settings-header">
          <h3>更新设置</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="btn btn-icon"
          >
            <X className="icon" />
          </button>
        </div>

        <div className="settings-content">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={config.auto_check}
                onChange={(e) => handleConfigChange({
                  ...config,
                  auto_check: e.target.checked
                })}
              />
              自动检查更新
            </label>
          </div>

          <div className="setting-item">
            <label>
              检查间隔 (小时):
              <input
                type="number"
                min="1"
                max="168"
                value={config.check_interval_hours}
                onChange={(e) => handleConfigChange({
                  ...config,
                  check_interval_hours: parseInt(e.target.value) || 24
                })}
              />
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={config.auto_download}
                onChange={(e) => handleConfigChange({
                  ...config,
                  auto_download: e.target.checked
                })}
              />
              自动下载更新
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={config.auto_install}
                onChange={(e) => handleConfigChange({
                  ...config,
                  auto_install: e.target.checked
                })}
              />
              自动安装更新
            </label>
          </div>

          <div className="setting-item">
            <label>
              更新渠道:
              <select
                value={config.update_channel}
                onChange={(e) => handleConfigChange({
                  ...config,
                  update_channel: e.target.value as 'Stable' | 'Beta' | 'Alpha'
                })}
              >
                <option value="Stable">稳定版</option>
                <option value="Beta">测试版</option>
                <option value="Alpha">开发版</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="update-manager">
      <div className="update-header">
        <h2>软件更新</h2>
        <div className="update-controls">
          <button
            onClick={handleCheckForUpdates}
            disabled={isChecking}
            className="btn btn-secondary"
          >
            <RefreshCw className={`icon ${isChecking ? 'spinning' : ''}`} />
            检查更新
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-icon"
          >
            <Settings className="icon" />
          </button>
        </div>
      </div>

      {renderUpdateStatus()}
      {renderSettings()}

      <style>{`
        .update-manager {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .update-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .update-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }

        .update-controls {
          display: flex;
          gap: 8px;
        }

        .update-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .update-status.checking {
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
        }

        .update-status.no-update {
          background-color: #f0fdf4;
          border: 1px solid #10b981;
        }

        .update-status.downloading {
          background-color: #f0f9ff;
          border: 1px solid #0ea5e9;
          flex-direction: column;
          align-items: stretch;
        }

        .update-status.error {
          background-color: #fef2f2;
          border: 1px solid #ef4444;
        }

        .update-available {
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          background-color: #fffbeb;
        }

        .update-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .update-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .release-date {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .update-info {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .critical-badge {
          background-color: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .changelog h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .changelog-content {
          background-color: white;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.5;
        }

        .update-actions {
          margin-top: 16px;
        }

        .download-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }

        .update-settings {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background-color: #f9fafb;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .settings-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .setting-item {
          margin-bottom: 16px;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .setting-item input[type="checkbox"] {
          margin: 0;
        }

        .setting-item input[type="number"],
        .setting-item select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .btn-icon {
          padding: 8px;
          background-color: transparent;
          color: #6b7280;
        }

        .btn-icon:hover {
          background-color: #f3f4f6;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon {
          width: 16px;
          height: 16px;
        }

        .icon.spinning {
          animation: spin 1s linear infinite;
        }

        .icon.critical {
          color: #ef4444;
        }

        .icon.normal {
          color: #f59e0b;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UpdateManager;
