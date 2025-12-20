import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Event,
  ShoppingCart,
  AttachMoney,
  Timer,
  ExitToApp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { DashboardMetrics } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  loading,
}) => {
  const isPositive = change && change >= 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: 'primary.light',
              borderRadius: 1,
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>

        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                wordBreak: 'break-word'
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                {isPositive ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={isPositive ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(change).toFixed(1)}%
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 0.5, display: { xs: 'none', sm: 'block' } }}
                >
                  vs last periods
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  });

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatRevenue = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your user tracking metrics
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={metrics?.overview.totalUsers || 0}
            change={metrics?.trends.usersChange}
            icon={<People sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Sessions"
            value={metrics?.overview.totalSessions || 0}
            change={metrics?.trends.sessionsChange}
            icon={<Event sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Purchases"
            value={metrics?.overview.totalPurchases || 0}
            icon={<ShoppingCart sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={formatRevenue(metrics?.overview.totalRevenue || 0)}
            change={metrics?.trends.revenueChange}
            icon={<AttachMoney sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Session Duration"
            value={formatDuration(metrics?.overview.avgSessionDuration || 0)}
            icon={<Timer sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Bounce Rate"
            value={`${metrics?.overview.bounceRate || 0}%`}
            icon={<ExitToApp sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Page Views"
            value={metrics?.overview.totalPageViews || 0}
            change={metrics?.trends.eventsChange}
            icon={<Event sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conversion Rate"
            value={`${metrics?.overview.conversionRate || 0}%`}
            icon={<TrendingUp sx={{ color: 'white', fontSize: 20 }} />}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* User Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                User Activity
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.userActivity || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={45} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Users"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      name="Sessions"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="events"
                      stroke="#9c27b0"
                      strokeWidth={2}
                      name="Events"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Event Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Event Breakdown
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.eventBreakdown || []}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                    >
                      {metrics?.eventBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} events`, name]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Pages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Top Pages
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={metrics?.topPages.slice(0, 5) || []}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="page"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                    />
                    <Tooltip />
                    <Bar dataKey="views" fill="#1976d2" name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Device Breakdown
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ p: 2 }}>
                  {metrics?.deviceBreakdown.map((device, index) => (
                    <Box key={device.device} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2">{device.device}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {device.percentage}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: 'grey.200',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${device.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
