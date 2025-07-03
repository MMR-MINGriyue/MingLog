import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Shield, AlertTriangle, Info, Settings } from 'lucide-react';

interface ErrorReportingConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  release: string;
  sample_rate: number;
  include_personal_data: boolean;
  auto_session_tracking: boolean;
}

interface ErrorTestResult {
  scenario: string;
  success: boolean;
  error_message?: string;
  duration_ms: number;
  error_reported: boolean;
  recovery_successful: boolean;
}

export const ErrorReportingSettings: React.FC = () => {
  const [config, setConfig] = useState<ErrorReportingConfig>({
    enabled: false,
    environment: 'production',
    release: '1.0.0',
    sample_rate: 1.0,
    include_personal_data: false,
    auto_session_tracking: true,
  });
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<ErrorTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    loadErrorReportingStatus();
  }, []);

  const loadErrorReportingStatus = async () => {
    try {
      const status = await invoke<boolean>('get_error_reporting_status');
      setIsEnabled(status);
    } catch (error) {
      console.error('Failed to load error reporting status:', error);
    }
  };

  const handleToggleErrorReporting = async () => {
    setIsLoading(true);
    try {
      const newStatus = !isEnabled;
      await invoke('toggle_error_reporting', { enabled: newStatus });
      setIsEnabled(newStatus);
      
      if (newStatus) {
        // 如果启用错误报告，配置Sentry
        await invoke('configure_error_reporting', { config });
      }
    } catch (error) {
      console.error('Failed to toggle error reporting:', error);
      alert('切换错误报告状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunErrorTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    try {
      const results = await invoke<ErrorTestResult[]>('run_error_tests');
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run error tests:', error);
      alert('运行错误测试失败');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunSingleTest = async (scenario: string) => {
    try {
      const result = await invoke<ErrorTestResult>('run_single_error_test', { scenario });
      setTestResults(prev => [...prev.filter(r => r.scenario !== scenario), result]);
    } catch (error) {
      console.error('Failed to run single test:', error);
    }
  };

  const getTestScenarioDisplayName = (scenario: string): string => {
    const names: Record<string, string> = {
      'DatabaseConnectionFailure': '数据库连接失败',
      'FilePermissionError': '文件权限错误',
      'NetworkTimeout': '网络超时',
      'MemoryExhaustion': '内存耗尽',
      'SystemTrayFailure': '系统托盘失败',
      'InvalidInput': '无效输入',
      'ConcurrencyIssue': '并发问题',
      'PerformanceDegradation': '性能降级',
    };
    return names[scenario] || scenario;
  };

  return (
    <div className="error-reporting-settings">
      <div className="settings-header">
        <h2 className="settings-title">
          <Shield className="icon" />
          错误报告设置
        </h2>
        <p className="settings-description">
          配置错误报告和监控设置，帮助我们改进应用程序质量
        </p>
      </div>

      {/* 错误报告开关 */}
      <div className="setting-section">
        <div className="setting-item">
          <div className="setting-info">
            <h3>启用错误报告</h3>
            <p>自动收集和报告应用程序错误，帮助我们快速修复问题</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggleErrorReporting}
              disabled={isLoading}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* 隐私保护说明 */}
      <div className="privacy-notice">
        <Info className="icon" />
        <div>
          <h4>隐私保护</h4>
          <ul>
            <li>我们不会收集任何个人身份信息</li>
            <li>错误报告中的敏感数据会被自动脱敏</li>
            <li>您可以随时禁用错误报告功能</li>
            <li>所有数据传输都经过加密保护</li>
          </ul>
        </div>
      </div>

      {/* 错误测试工具 */}
      <div className="setting-section">
        <div className="section-header">
          <h3>
            <Settings className="icon" />
            错误测试工具
          </h3>
          <p>测试错误报告系统的功能和恢复机制</p>
        </div>

        <div className="test-controls">
          <button
            onClick={handleRunErrorTests}
            disabled={isRunningTests}
            className="btn btn-primary"
          >
            {isRunningTests ? '运行中...' : '运行所有测试'}
          </button>
        </div>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <div className="test-results">
            <h4>测试结果</h4>
            <div className="results-grid">
              {testResults.map((result, index) => (
                <div key={index} className={`result-card ${result.success ? 'success' : 'failure'}`}>
                  <div className="result-header">
                    <span className="scenario-name">
                      {getTestScenarioDisplayName(result.scenario)}
                    </span>
                    <span className={`status ${result.success ? 'success' : 'failure'}`}>
                      {result.success ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="result-details">
                    <div className="detail-item">
                      <span>耗时:</span>
                      <span>{result.duration_ms}ms</span>
                    </div>
                    <div className="detail-item">
                      <span>错误已报告:</span>
                      <span>{result.error_reported ? '是' : '否'}</span>
                    </div>
                    <div className="detail-item">
                      <span>恢复成功:</span>
                      <span>{result.recovery_successful ? '是' : '否'}</span>
                    </div>
                    {result.error_message && (
                      <div className="error-message">
                        {result.error_message}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRunSingleTest(result.scenario)}
                    className="btn btn-small"
                  >
                    重新测试
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .error-reporting-settings {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .settings-description {
          color: #6b7280;
          font-size: 14px;
        }

        .setting-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .setting-info h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .setting-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #3b82f6;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .privacy-notice {
          display: flex;
          gap: 12px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .privacy-notice .icon {
          color: #0ea5e9;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .privacy-notice h4 {
          margin: 0 0 8px 0;
          color: #0c4a6e;
        }

        .privacy-notice ul {
          margin: 0;
          padding-left: 16px;
          color: #0c4a6e;
        }

        .privacy-notice li {
          margin-bottom: 4px;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .section-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .test-controls {
          margin-bottom: 24px;
        }

        .btn {
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

        .btn-primary:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-small:hover {
          background-color: #e5e7eb;
        }

        .test-results h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .result-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .result-card.success {
          border-color: #10b981;
          background-color: #f0fdf4;
        }

        .result-card.failure {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .scenario-name {
          font-weight: 600;
        }

        .status.success {
          color: #10b981;
          font-weight: bold;
        }

        .status.failure {
          color: #ef4444;
          font-weight: bold;
        }

        .result-details {
          margin-bottom: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .error-message {
          margin-top: 8px;
          padding: 8px;
          background-color: #fee2e2;
          border-radius: 4px;
          font-size: 12px;
          color: #991b1b;
        }

        .icon {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

export default ErrorReportingSettings;
