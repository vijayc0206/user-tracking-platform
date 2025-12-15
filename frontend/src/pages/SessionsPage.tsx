import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import { Session, SessionStatus } from '../types';

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
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getStatusColor = (status: SessionStatus): 'success' | 'default' | 'warning' => {
  switch (status) {
    case SessionStatus.ACTIVE:
      return 'success';
    case SessionStatus.ENDED:
      return 'default';
    case SessionStatus.EXPIRED:
      return 'warning';
    default:
      return 'default';
  }
};

export const SessionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', paginationModel.page, paginationModel.pageSize, search, statusFilter],
    queryFn: () =>
      sessionService.search({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        userId: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const columns: GridColDef[] = [
    {
      field: 'sessionId',
      headerName: 'Session ID',
      width: 180,
      renderCell: (params: GridRenderCellParams<Session>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.sessionId?.slice(0, 12)}...
        </Typography>
      ),
    },
    {
      field: 'userId',
      headerName: 'User ID',
      width: 150,
      renderCell: (params: GridRenderCellParams<Session>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.userId?.slice(0, 10)}...
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Session>) => (
        <Chip
          label={params.row.status}
          size="small"
          color={getStatusColor(params.row.status)}
        />
      ),
    },
    {
      field: 'startTime',
      headerName: 'Start Time',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'endTime',
      headerName: 'End Time',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 120,
      valueFormatter: (params) => formatDuration(params.value),
    },
    {
      field: 'pageViews',
      headerName: 'Page Views',
      width: 100,
      type: 'number',
    },
    {
      field: 'events',
      headerName: 'Events',
      width: 100,
      type: 'number',
    },
    {
      field: 'device',
      headerName: 'Device',
      width: 100,
    },
    {
      field: 'browser',
      headerName: 'Browser',
      width: 100,
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 100,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and analyze user sessions
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by user ID..."
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
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="ENDED">Ended</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
              </Select>
            </FormControl>
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
                minWidth: 900,
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
