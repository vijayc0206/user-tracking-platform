import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonOff, PersonAdd, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { adminService } from '../services/adminService';
import { AdminUser, UserRole } from '../types';

const formatDate = (value: unknown): string => {
  if (!value) return 'Never';
  try {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return 'Never';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Never';
  }
};

const getRoleColor = (role: UserRole): 'error' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default' => {
  switch (role) {
    case UserRole.ADMIN:
      return 'error';
    case UserRole.MANAGER:
      return 'warning';
    case UserRole.ANALYST:
      return 'primary';
    case UserRole.VIEWER:
      return 'info';
    case UserRole.USER:
      return 'default';
    default:
      return 'secondary';
  }
};

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User role updated successfully', { variant: 'success' });
      setRoleDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to update user role', { variant: 'error' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => adminService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User deactivated successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to deactivate user', { variant: 'error' });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      enqueueSnackbar('User activated successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to activate user', { variant: 'error' });
    },
  });

  const handleEditRole = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (selectedUser) {
      const userId = (selectedUser as unknown as { _id: string })._id || selectedUser.id;
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'User',
      width: 250,
      renderCell: (params: GridRenderCellParams<AdminUser>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
            {params.row.firstName?.[0]}{params.row.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {params.row.firstName} {params.row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (params: GridRenderCellParams<AdminUser>) => (
        <Chip
          label={params.row.role}
          size="small"
          color={getRoleColor(params.row.role)}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<AdminUser>) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={params.row.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'lastLogin',
      headerName: 'Last Login',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<AdminUser>) => (
        <Box>
          <Tooltip title="Edit Role">
            <IconButton
              size="small"
              onClick={() => handleEditRole(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.isActive ? (
            <Tooltip title="Deactivate User">
              <IconButton
                size="small"
                color="error"
                onClick={() => deactivateMutation.mutate((params.row as unknown as { _id: string })._id || params.row.id)}
                disabled={deactivateMutation.isPending}
              >
                <PersonOff fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Activate User">
              <IconButton
                size="small"
                color="success"
                onClick={() => activateMutation.mutate((params.row as unknown as { _id: string })._id || params.row.id)}
                disabled={activateMutation.isPending}
              >
                <PersonAdd fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Admin Panel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System administration and user management
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Admin Users
          </Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={users || []}
              columns={columns}
              loading={isLoading}
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              getRowId={(row) => row._id || row.id}
              disableRowSelectionOnClick
              autoHeight
              sx={{
                minWidth: 800,
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Role Edit Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Change role for: <strong>{selectedUser?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              label="Role"
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <MenuItem value={UserRole.VIEWER}>Viewer</MenuItem>
              <MenuItem value={UserRole.USER}>User</MenuItem>
              <MenuItem value={UserRole.ANALYST}>Analyst</MenuItem>
              <MenuItem value={UserRole.MANAGER}>Manager</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={updateRoleMutation.isPending}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
