import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Search, Visibility } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { User } from '../types';

const formatDate = (value: unknown): string => {
  if (!value) return 'N/A';
  try {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', paginationModel.page, paginationModel.pageSize, search],
    queryFn: () =>
      userService.search({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: search || undefined,
      }),
  });

  const columns: GridColDef[] = [
    {
      field: 'visitorId',
      headerName: 'Visitor ID',
      width: 200,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {params.row.firstName?.[0] || params.row.visitorId[0].toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {params.row.visitorId.slice(0, 8)}...
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      valueGetter: (params) => params.row?.email || 'Anonymous',
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      valueGetter: (params) =>
        params.row?.firstName && params.row?.lastName
          ? `${params.row.firstName} ${params.row.lastName}`
          : 'N/A',
    },
    {
      field: 'totalEvents',
      headerName: 'Events',
      width: 100,
      type: 'number',
    },
    {
      field: 'totalSessions',
      headerName: 'Sessions',
      width: 100,
      type: 'number',
    },
    {
      field: 'totalPurchases',
      headerName: 'Purchases',
      width: 100,
      type: 'number',
    },
    {
      field: 'totalRevenue',
      headerName: 'Revenue',
      width: 120,
      type: 'number',
      valueFormatter: (params) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(params.value || 0),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 200,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.row.tags?.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
          {params.row.tags?.length > 2 && (
            <Chip label={`+${params.row.tags.length - 2}`} size="small" />
          )}
        </Box>
      ),
    },
    {
      field: 'lastSeen',
      headerName: 'Last Seen',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<User>) => (
        <IconButton
          size="small"
          onClick={() => navigate(`/users/${params.row.visitorId}`)}
        >
          <Visibility />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Users
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and view user profiles
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search by email, name, or visitor ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <DataGrid
              rows={data?.data || []}
              columns={columns}
              rowCount={data?.meta?.total || 0}
              loading={isLoading}
              pageSizeOptions={[10, 20, 50]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              getRowId={(row) => row._id}
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
    </Box>
  );
};
