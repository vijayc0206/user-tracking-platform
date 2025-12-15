import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { analyticsService } from '../services/analyticsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export const AnalyticsPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  });

  const { data: userInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['user-insights'],
    queryFn: () => analyticsService.getUserInsights(),
  });

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Advanced analytics and reporting
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* User Activity Over Time */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                User Activity Over Time
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.userActivity || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={40} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={40} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke="#1976d2"
                      strokeWidth={2}
                      name="Users"
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sessions"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      name="Sessions"
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Event Type Distribution
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} events`, name]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: '11px', paddingLeft: '5px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Top Countries by Sessions
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={metrics?.geographicData?.slice(0, 10) || []}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="country" type="category" width={50} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="sessions" fill="#1976d2" name="Sessions" />
                    <Bar dataKey="users" fill="#2e7d32" name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Device Distribution
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : (
                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                  {metrics?.deviceBreakdown.map((device, index) => (
                    <Box key={device.device} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {device.device}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {device.count.toLocaleString()} ({device.percentage}%)
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 10,
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

        {/* User Segments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Active Users
              </Typography>
              {insightsLoading ? (
                <Skeleton variant="rectangular" height={250} />
              ) : (
                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                        <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                          {userInsights?.activeUsers?.daily?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Daily Active
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                        <Typography variant="h4" fontWeight={700} color="secondary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                          {userInsights?.activeUsers?.weekly?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Weekly Active
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                        <Typography variant="h4" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                          {userInsights?.activeUsers?.monthly?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Monthly Active
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      New vs Returning Users
                    </Typography>
                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}>
                      <Box sx={{ flex: 1, textAlign: 'center', p: { xs: 1, sm: 2 }, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          {userInsights?.newVsReturning?.newUsers?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="caption">New Users</Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center', p: { xs: 1, sm: 2 }, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          {userInsights?.newVsReturning?.returningUsers?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="caption">Returning Users</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Pages */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Top Pages by Views
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <ResponsiveContainer width="100%" height={300} minWidth={500}>
                    <BarChart data={metrics?.topPages?.slice(0, 10) || []} margin={{ top: 5, right: 10, left: 10, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="page"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tickFormatter={(value) => value.length > 20 ? `${value.slice(0, 20)}...` : value}
                      />
                      <YAxis tick={{ fontSize: 10 }} width={40} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="views" fill="#1976d2" name="Views" />
                      <Bar dataKey="uniqueUsers" fill="#9c27b0" name="Unique Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
