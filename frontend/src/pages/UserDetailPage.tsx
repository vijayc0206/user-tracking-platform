import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Skeleton,
  Alert,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Email,
  Event as EventIcon,
  ShoppingCart,
  AttachMoney,
  ArrowBack,
  Timeline,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { eventService } from '../services/eventService';
import { sessionService } from '../services/sessionService';
import { User, Event, Session } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const UserDetailPage: React.FC = () => {
  const { visitorId } = useParams<{ visitorId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    isError,
  } = useQuery<User>({
    queryKey: ['user', visitorId],
    queryFn: () => userService.getByVisitorId(visitorId!),
    enabled: !!visitorId,
    retry: 1,
  });

  const { data: eventsResponse, isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events', visitorId],
    queryFn: () => eventService.search({ userId: visitorId, limit: 50 }),
    enabled: !!visitorId,
  });

  const { data: sessionsResponse, isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions', visitorId],
    queryFn: () => sessionService.search({ userId: visitorId, limit: 20 }),
    enabled: !!visitorId,
  });

  const events = eventsResponse?.data || [];
  const sessions = sessionsResponse?.data || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (userLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (isError || !user) {
    const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <Alert severity="error">
          {errorMessage.includes('401') || errorMessage.includes('UNAUTHORIZED')
            ? 'Please log in to view user details.'
            : `User not found. The visitor ID may be invalid or the user may have been deleted.`}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/users')}
        sx={{ mb: 2 }}
      >
        Back to Users
      </Button>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        User Details
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Visitor ID: {user.visitorId}
      </Typography>

      {/* User Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.main',
                    fontSize: 24,
                  }}
                >
                  {user.firstName?.[0] || user.email?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'Anonymous User'}
                  </Typography>
                  {user.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <EventIcon color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  {user.totalEvents.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Events
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Timeline color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  {user.totalSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <ShoppingCart color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  {user.totalPurchases}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Purchases
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <AttachMoney color="primary" />
                <Typography variant="h5" fontWeight={700}>
                  {formatRevenue(user.totalRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                User Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    First Seen
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.firstSeen)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Seen
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.lastSeen)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.tags && user.tags.length > 0 ? (
                      user.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tags
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Segments
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.segments && user.segments.length > 0 ? (
                      user.segments.map((segment) => (
                        <Chip
                          key={segment}
                          label={segment}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No segments
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Attributes
              </Typography>
              {user.attributes && Object.keys(user.attributes).length > 0 ? (
                <Grid container spacing={1}>
                  {Object.entries(user.attributes).map(([key, value]) => (
                    <Grid item xs={6} key={key}>
                      <Typography variant="body2" color="text.secondary">
                        {key}
                      </Typography>
                      <Typography variant="body1">
                        {String(value)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No custom attributes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Events and Sessions */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label={`Events (${events.length})`} />
            <Tab label={`Sessions (${sessions.length})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {eventsLoading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : events.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Page URL</TableCell>
                      <TableCell>Properties</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event: Event) => (
                      <TableRow key={event._id}>
                        <TableCell>
                          <Chip
                            label={event.eventType}
                            size="small"
                            color={
                              event.eventType === 'PURCHASE'
                                ? 'success'
                                : event.eventType === 'PAGE_VIEW'
                                ? 'primary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDate(event.timestamp)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.pageUrl || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.properties && Object.keys(event.properties).length > 0
                              ? JSON.stringify(event.properties).slice(0, 50) + '...'
                              : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No events found for this user.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {sessionsLoading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : sessions.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Session ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Page Views</TableCell>
                      <TableCell>Device</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session: Session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {session.sessionId.slice(0, 12)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.status}
                            size="small"
                            color={
                              session.status === 'ACTIVE'
                                ? 'success'
                                : session.status === 'ENDED'
                                ? 'default'
                                : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDate(session.startTime)}</TableCell>
                        <TableCell>{formatDuration(session.duration)}</TableCell>
                        <TableCell>{session.pageViews}</TableCell>
                        <TableCell>{session.device || '-'}</TableCell>
                        <TableCell>
                          {session.city && session.country
                            ? `${session.city}, ${session.country}`
                            : session.country || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No sessions found for this user.</Alert>
            )}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
