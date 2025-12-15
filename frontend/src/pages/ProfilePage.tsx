import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
  Skeleton,
} from '@mui/material';
import {
  Email,
  Person,
  Badge,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { AdminUser } from '../types';

export const ProfilePage: React.FC = () => {
  const { data: user, isLoading } = useQuery<AdminUser>({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'MANAGER':
        return 'warning';
      case 'ANALYST':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={250} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={250} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your profile information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: 40,
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>
              <Chip
                label={user?.role || 'USER'}
                color={getRoleColor(user?.role) as 'error' | 'warning' | 'info' | 'default'}
                sx={{ fontWeight: 600 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Profile Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      First Name
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {user?.firstName || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Last Name
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {user?.lastName || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Email Address
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {user?.email || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Badge color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {user?.role || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Account Created
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(user?.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime color="action" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Last Login
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(user?.lastLogin)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Account Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={user?.isActive ? 'Active' : 'Inactive'}
                    color={user?.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Administrator
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Two-Factor Auth
                  </Typography>
                  <Chip
                    label="Not Enabled"
                    color="warning"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Email Verified
                  </Typography>
                  <Chip
                    label="Verified"
                    color="success"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
