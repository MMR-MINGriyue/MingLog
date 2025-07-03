import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface PerformanceMetrics {
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_usage: Record<string, DiskUsage>;
  network_stats: NetworkStats;
  app_metrics: AppMetrics;
}

interface DiskUsage {
  total: number;
  used: number;
  available: number;
  usage_percent: number;
}

interface NetworkStats {
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
}

interface AppMetrics {
  startup_time?: number;
  response_times: Record<string, number[]>;
  error_count: number;
  active_users: number;
  database_connections: number;
  cache_hit_rate: number;
}

interface FeedbackStats {
  total_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  resolution_time_avg?: number;
  satisfaction_score?: number;
}

const MonitoringDashboard: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadInitialData();
    setupEventListeners();
    
    // 定期刷新数据
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // 加载当前性能指标
      const current = await invoke<PerformanceMetrics | null>('get_current_performance_metrics');
      if (current) {
        setCurrentMetrics(current);
      }

      // 加载性能历史
      const history = await invoke<PerformanceMetrics[]>('get_performance_metrics', { limit: 50 });
      setMetricsHistory(history);

      // 加载反馈统计
      const feedback = await invoke<FeedbackStats>('get_feedback_statistics');
      setFeedbackStats(feedback);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('加载监控数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = async () => {
    // 监听性能指标更新
    await listen<PerformanceMetrics>('performance-metrics', (event) => {
      setCurrentMetrics(event.payload);
      setMetricsHistory(prev => [...prev.slice(-49), event.payload]);
      setLastUpdate(new Date());
    });

    // 监听性能告警
    await listen<string[]>('performance-alerts', (event) => {
      setAlerts(event.payload);
    });
  };

  const refreshData = async () => {
    try {
      const current = await invoke<PerformanceMetrics | null>('get_current_performance_metrics');
      if (current) {
        setCurrentMetrics(current);
      }

      const feedback = await invoke<FeedbackStats>('get_feedback_statistics');
      setFeedbackStats(feedback);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'warning';
    return 'default';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载监控数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">运维监控仪表板</h1>
          <p className="text-muted-foreground">
            最后更新: {lastUpdate.toLocaleString()}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 告警信息 */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>性能告警</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="performance">性能监控</TabsTrigger>
          <TabsTrigger value="feedback">用户反馈</TabsTrigger>
          <TabsTrigger value="system">系统状态</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* CPU 使用率 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics?.cpu_usage.toFixed(1)}%
                </div>
                <Progress 
                  value={currentMetrics?.cpu_usage || 0} 
                  className="mt-2"
                />
                <Badge 
                  variant={getStatusColor(currentMetrics?.cpu_usage || 0, { warning: 70, critical: 85 })}
                  className="mt-2"
                >
                  {currentMetrics?.cpu_usage && currentMetrics.cpu_usage > 85 ? '高' : 
                   currentMetrics?.cpu_usage && currentMetrics.cpu_usage > 70 ? '中' : '正常'}
                </Badge>
              </CardContent>
            </Card>

            {/* 内存使用率 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics ? 
                    ((currentMetrics.memory_usage / currentMetrics.memory_total) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentMetrics && `${formatBytes(currentMetrics.memory_usage)} / ${formatBytes(currentMetrics.memory_total)}`}
                </div>
                <Progress 
                  value={currentMetrics ? (currentMetrics.memory_usage / currentMetrics.memory_total) * 100 : 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* 活跃用户 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics?.app_metrics.active_users || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前在线用户数
                </p>
              </CardContent>
            </Card>

            {/* 错误数量 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">错误数量</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics?.app_metrics.error_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  累计错误数量
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 性能趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle>性能趋势</CardTitle>
              <CardDescription>CPU 和内存使用率变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatTimestamp(value as number)}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`,
                      name === 'cpu_usage' ? 'CPU' : '内存'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu_usage" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="cpu_usage"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={(data) => (data.memory_usage / data.memory_total) * 100}
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="memory_usage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 性能监控标签页 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 磁盘使用情况 */}
            <Card>
              <CardHeader>
                <CardTitle>磁盘使用情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMetrics && Object.entries(currentMetrics.disk_usage).map(([disk, usage]) => (
                    <div key={disk}>
                      <div className="flex justify-between text-sm">
                        <span>{disk}</span>
                        <span>{usage.usage_percent.toFixed(1)}%</span>
                      </div>
                      <Progress value={usage.usage_percent} className="mt-1" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatBytes(usage.used)} / {formatBytes(usage.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 网络统计 */}
            <Card>
              <CardHeader>
                <CardTitle>网络统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>发送字节数:</span>
                    <span>{currentMetrics && formatBytes(currentMetrics.network_stats.bytes_sent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>接收字节数:</span>
                    <span>{currentMetrics && formatBytes(currentMetrics.network_stats.bytes_received)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>发送包数:</span>
                    <span>{currentMetrics?.network_stats.packets_sent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>接收包数:</span>
                    <span>{currentMetrics?.network_stats.packets_received.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 用户反馈标签页 */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* 反馈总数 */}
            <Card>
              <CardHeader>
                <CardTitle>反馈总数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {feedbackStats?.total_count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  累计用户反馈数量
                </p>
              </CardContent>
            </Card>

            {/* 平均解决时间 */}
            <Card>
              <CardHeader>
                <CardTitle>平均解决时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {feedbackStats?.resolution_time_avg ? 
                    `${feedbackStats.resolution_time_avg.toFixed(1)}h` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  问题平均解决时间
                </p>
              </CardContent>
            </Card>

            {/* 满意度评分 */}
            <Card>
              <CardHeader>
                <CardTitle>满意度评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {feedbackStats?.satisfaction_score ? 
                    feedbackStats.satisfaction_score.toFixed(1) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  用户满意度评分
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 反馈类型分布 */}
          {feedbackStats && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>反馈类型分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={Object.entries(feedbackStats.by_type).map(([type, count]) => ({
                          name: type,
                          value: count,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {Object.entries(feedbackStats.by_type).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>反馈状态分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(feedbackStats.by_status).map(([status, count]) => ({
                      status,
                      count,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 系统状态标签页 */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 应用信息 */}
            <Card>
              <CardHeader>
                <CardTitle>应用信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>版本:</span>
                    <span>v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>启动时间:</span>
                    <span>
                      {currentMetrics?.app_metrics.startup_time ? 
                        `${currentMetrics.app_metrics.startup_time}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>数据库连接:</span>
                    <span>{currentMetrics?.app_metrics.database_connections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>缓存命中率:</span>
                    <span>
                      {currentMetrics?.app_metrics.cache_hit_rate ? 
                        `${(currentMetrics.app_metrics.cache_hit_rate * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 系统健康状态 */}
            <Card>
              <CardHeader>
                <CardTitle>系统健康状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>CPU 状态</span>
                    <Badge variant={getStatusColor(currentMetrics?.cpu_usage || 0, { warning: 70, critical: 85 })}>
                      {currentMetrics?.cpu_usage && currentMetrics.cpu_usage > 85 ? '异常' : '正常'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>内存状态</span>
                    <Badge variant={getStatusColor(
                      currentMetrics ? (currentMetrics.memory_usage / currentMetrics.memory_total) * 100 : 0,
                      { warning: 80, critical: 90 }
                    )}>
                      {currentMetrics && (currentMetrics.memory_usage / currentMetrics.memory_total) * 100 > 90 ? '异常' : '正常'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>错误率</span>
                    <Badge variant={currentMetrics?.app_metrics.error_count && currentMetrics.app_metrics.error_count > 100 ? 'destructive' : 'default'}>
                      {currentMetrics?.app_metrics.error_count && currentMetrics.app_metrics.error_count > 100 ? '异常' : '正常'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
