/**
 * MingLog 报告生成器
 * 负责生成各种类型的测试和监控报告
 */

const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
    constructor() {
        this.config = null;
        this.reportTemplates = {
            html: this.generateHTMLReport.bind(this),
            json: this.generateJSONReport.bind(this),
            xml: this.generateXMLReport.bind(this)
        };
    }

    async initialize(config) {
        this.config = config;
        
        // 创建报告目录
        await this.createReportDirectories();
        
        console.log('📊 报告生成器初始化完成');
    }

    async createReportDirectories() {
        const dirs = [
            this.config.reporting.output_directory,
            path.join(this.config.reporting.output_directory, 'daily'),
            path.join(this.config.reporting.output_directory, 'weekly'),
            path.join(this.config.reporting.output_directory, 'incidents'),
            path.join(this.config.reporting.output_directory, 'performance')
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`创建报告目录失败: ${dir}`, error.message);
                }
            }
        }
    }

    async generateTestReport(testSession) {
        console.log(`📊 生成测试报告: ${testSession.id}`);

        const report = {
            metadata: {
                sessionId: testSession.id,
                suite: testSession.suite,
                startTime: new Date(testSession.startTime).toISOString(),
                endTime: new Date(testSession.endTime).toISOString(),
                duration: testSession.duration,
                generatedAt: new Date().toISOString()
            },
            summary: this.generateTestSummary(testSession),
            tests: testSession.tests,
            errors: testSession.errors,
            fixes: testSession.fixes,
            statistics: this.calculateTestStatistics(testSession)
        };

        // 生成多种格式的报告
        const reportFiles = [];
        const formats = this.config?.reporting?.format || ['json', 'html'];

        for (const format of formats) {
            if (this.reportTemplates[format]) {
                const filePath = await this.reportTemplates[format](report, 'test');
                reportFiles.push(filePath);
            }
        }

        return {
            report,
            filePaths: reportFiles,
            filePath: reportFiles[0] // 主报告文件
        };
    }

    generateTestSummary(testSession) {
        const totalTests = testSession.tests.length;
        const passedTests = testSession.tests.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        const totalErrors = testSession.errors.length;
        const totalFixes = testSession.fixes.length;
        const successfulFixes = testSession.fixes.filter(f => f.success).length;

        return {
            totalTests,
            passedTests,
            failedTests,
            passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
            totalErrors,
            totalFixes,
            successfulFixes,
            fixSuccessRate: totalFixes > 0 ? (successfulFixes / totalFixes) * 100 : 0,
            status: failedTests === 0 ? 'PASSED' : 'FAILED'
        };
    }

    calculateTestStatistics(testSession) {
        const stats = {
            testDurations: {},
            errorsByCategory: {},
            errorsBySeverity: {},
            fixesByStrategy: {}
        };

        // 测试持续时间统计
        testSession.tests.forEach(test => {
            stats.testDurations[test.type] = test.duration;
        });

        // 错误分类统计
        testSession.tests.forEach(test => {
            test.errors.forEach(error => {
                stats.errorsByCategory[error.category] = 
                    (stats.errorsByCategory[error.category] || 0) + 1;
                stats.errorsBySeverity[error.severity] = 
                    (stats.errorsBySeverity[error.severity] || 0) + 1;
            });
        });

        // 修复策略统计
        testSession.fixes.forEach(fix => {
            stats.fixesByStrategy[fix.strategy] = 
                (stats.fixesByStrategy[fix.strategy] || 0) + 1;
        });

        return stats;
    }

    async generateHTMLReport(report, type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_report_${timestamp}.html`;
        const outputDir = this.config?.reporting?.output_directory || './reports';
        const filePath = path.join(outputDir, filename);

        const html = this.createHTMLTemplate(report, type);
        
        await fs.writeFile(filePath, html, 'utf8');
        console.log(`📄 HTML报告已生成: ${filename}`);
        
        return filePath;
    }

    createHTMLTemplate(report, type) {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MingLog ${type === 'test' ? '测试' : '监控'}报告</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.9; margin-top: 10px; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric.success { border-left-color: #28a745; }
        .metric.warning { border-left-color: #ffc107; }
        .metric.error { border-left-color: #dc3545; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .test-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .error-item { background: #fff5f5; border: 1px solid #fed7d7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .fix-item { background: #f0fff4; border: 1px solid #c6f6d5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .timestamp { color: #666; font-size: 0.8em; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .chart-placeholder { background: #f8f9fa; height: 200px; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 MingLog ${type === 'test' ? '测试' : '监控'}报告</h1>
            <div class="subtitle">
                生成时间: ${report.metadata.generatedAt} | 
                ${type === 'test' ? `测试套件: ${report.metadata.suite}` : '系统监控报告'}
            </div>
        </div>
        
        <div class="content">
            ${this.generateSummarySection(report)}
            ${this.generateTestsSection(report)}
            ${this.generateErrorsSection(report)}
            ${this.generateFixesSection(report)}
            ${this.generateStatisticsSection(report)}
        </div>
    </div>
</body>
</html>`;
    }

    generateSummarySection(report) {
        if (!report.summary) return '';
        
        const summary = report.summary;
        return `
        <div class="section">
            <h2>📊 测试概览</h2>
            <div class="summary">
                <div class="metric ${summary.status === 'PASSED' ? 'success' : 'error'}">
                    <div class="metric-value">${summary.totalTests}</div>
                    <div class="metric-label">总测试数</div>
                </div>
                <div class="metric success">
                    <div class="metric-value">${summary.passedTests}</div>
                    <div class="metric-label">通过测试</div>
                </div>
                <div class="metric error">
                    <div class="metric-value">${summary.failedTests}</div>
                    <div class="metric-label">失败测试</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${summary.passRate.toFixed(1)}%</div>
                    <div class="metric-label">通过率</div>
                </div>
                <div class="metric warning">
                    <div class="metric-value">${summary.totalErrors}</div>
                    <div class="metric-label">错误总数</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${summary.totalFixes}</div>
                    <div class="metric-label">修复尝试</div>
                </div>
            </div>
        </div>`;
    }

    generateTestsSection(report) {
        if (!report.tests || report.tests.length === 0) return '';
        
        const testsHtml = report.tests.map(test => `
            <div class="test-item ${test.passed ? 'passed' : 'failed'}">
                <h4>${test.type} <span class="status-badge status-${test.passed ? 'passed' : 'failed'}">${test.passed ? '通过' : '失败'}</span></h4>
                <p>持续时间: ${test.duration}ms</p>
                ${test.errors.length > 0 ? `<p>错误数: ${test.errors.length}</p>` : ''}
                <div class="timestamp">开始时间: ${new Date(test.startTime).toLocaleString('zh-CN')}</div>
            </div>
        `).join('');

        return `
        <div class="section">
            <h2>🧪 测试详情</h2>
            ${testsHtml}
        </div>`;
    }

    generateErrorsSection(report) {
        const allErrors = [];
        
        // 收集所有错误
        if (report.errors) allErrors.push(...report.errors);
        if (report.tests) {
            report.tests.forEach(test => {
                if (test.errors) allErrors.push(...test.errors);
            });
        }
        
        if (allErrors.length === 0) return '';
        
        const errorsHtml = allErrors.map(error => `
            <div class="error-item">
                <h4>❌ ${error.type || '未知错误'}</h4>
                <p><strong>消息:</strong> ${error.message}</p>
                ${error.severity ? `<p><strong>严重程度:</strong> ${error.severity}</p>` : ''}
                ${error.category ? `<p><strong>类别:</strong> ${error.category}</p>` : ''}
                <div class="timestamp">${error.timestamp}</div>
            </div>
        `).join('');

        return `
        <div class="section">
            <h2>❌ 错误详情</h2>
            ${errorsHtml}
        </div>`;
    }

    generateFixesSection(report) {
        if (!report.fixes || report.fixes.length === 0) return '';
        
        const fixesHtml = report.fixes.map(fix => `
            <div class="fix-item">
                <h4>🔧 ${fix.strategy} <span class="status-badge status-${fix.success ? 'passed' : 'failed'}">${fix.success ? '成功' : '失败'}</span></h4>
                <p><strong>错误类型:</strong> ${fix.error?.type || '未知'}</p>
                <p><strong>修复结果:</strong> ${fix.result?.message || '无详细信息'}</p>
                ${fix.result?.duration ? `<p><strong>修复时间:</strong> ${fix.result.duration}ms</p>` : ''}
                ${fix.result?.attempts ? `<p><strong>尝试次数:</strong> ${fix.result.attempts}</p>` : ''}
            </div>
        `).join('');

        return `
        <div class="section">
            <h2>🔧 修复详情</h2>
            ${fixesHtml}
        </div>`;
    }

    generateStatisticsSection(report) {
        if (!report.statistics) return '';
        
        return `
        <div class="section">
            <h2>📈 统计信息</h2>
            <div class="chart-placeholder">
                统计图表将在未来版本中实现
            </div>
            <pre>${JSON.stringify(report.statistics, null, 2)}</pre>
        </div>`;
    }

    async generateJSONReport(report, type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_report_${timestamp}.json`;
        const outputDir = this.config?.reporting?.output_directory || './reports';
        const filePath = path.join(outputDir, filename);

        await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`📄 JSON报告已生成: ${filename}`);
        
        return filePath;
    }

    async generateXMLReport(report, type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${type}_report_${timestamp}.xml`;
        const outputDir = this.config?.reporting?.output_directory || './reports';
        const filePath = path.join(outputDir, filename);

        const xml = this.convertToXML(report);
        await fs.writeFile(filePath, xml, 'utf8');
        console.log(`📄 XML报告已生成: ${filename}`);
        
        return filePath;
    }

    convertToXML(obj, rootName = 'report') {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
        return xmlHeader + this.objectToXML(obj, rootName);
    }

    objectToXML(obj, tagName) {
        if (typeof obj !== 'object' || obj === null) {
            return `<${tagName}>${this.escapeXML(String(obj))}</${tagName}>`;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.objectToXML(item, tagName.slice(0, -1))).join('\n');
        }

        const content = Object.entries(obj)
            .map(([key, value]) => this.objectToXML(value, key))
            .join('\n');

        return `<${tagName}>\n${content}\n</${tagName}>`;
    }

    escapeXML(str) {
        return str.replace(/[<>&'"]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return char;
            }
        });
    }

    async generateIncidentReport(error, fixResult) {
        const incident = {
            id: `incident_${Date.now()}`,
            timestamp: new Date().toISOString(),
            error,
            fixResult,
            severity: error.severity,
            resolved: fixResult.success
        };

        const filename = `incident_${incident.id}.json`;
        const filePath = path.join(
            this.config.reporting.output_directory, 
            'incidents', 
            filename
        );

        await fs.writeFile(filePath, JSON.stringify(incident, null, 2), 'utf8');
        console.log(`📄 事件报告已生成: ${filename}`);
        
        return filePath;
    }

    async generateSummaryReport(testResults) {
        const summary = {
            generatedAt: new Date().toISOString(),
            totalSessions: testResults.length,
            overallStats: this.calculateOverallStats(testResults),
            sessionSummaries: testResults.map(session => ({
                id: session.id,
                suite: session.suite,
                duration: session.duration,
                testsCount: session.tests.length,
                errorsCount: session.errors.length,
                fixesCount: session.fixes.length,
                status: session.tests.every(t => t.passed) ? 'PASSED' : 'FAILED'
            }))
        };

        const filename = `summary_${Date.now()}.json`;
        const filePath = path.join(this.config.reporting.output_directory, filename);

        await fs.writeFile(filePath, JSON.stringify(summary, null, 2), 'utf8');
        console.log(`📄 汇总报告已生成: ${filename}`);
        
        return filePath;
    }

    calculateOverallStats(testResults) {
        const stats = {
            totalTests: 0,
            passedTests: 0,
            totalErrors: 0,
            totalFixes: 0,
            successfulFixes: 0,
            totalDuration: 0
        };

        testResults.forEach(session => {
            stats.totalTests += session.tests.length;
            stats.passedTests += session.tests.filter(t => t.passed).length;
            stats.totalErrors += session.errors.length;
            stats.totalFixes += session.fixes.length;
            stats.successfulFixes += session.fixes.filter(f => f.success).length;
            stats.totalDuration += session.duration;
        });

        stats.passRate = stats.totalTests > 0 ? (stats.passedTests / stats.totalTests) * 100 : 0;
        stats.fixSuccessRate = stats.totalFixes > 0 ? (stats.successfulFixes / stats.totalFixes) * 100 : 0;

        return stats;
    }
}

module.exports = ReportGenerator;
