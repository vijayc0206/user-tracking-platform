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
import { eventService } from '../services/eventService';
import { Event, EventType } from '../types';

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

const getEventColor = (eventType: EventType): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (eventType) {
    case EventType.PAGE_VIEW:
      return 'primary';
    case EventType.PURCHASE:
      return 'success';
    case EventType.ADD_TO_CART:
      return 'info';
    case EventType.REMOVE_FROM_CART:
      return 'warning';
    case EventType.SESSION_START:
      return 'secondary';
    case EventType.SESSION_END:
      return 'default';
    case EventType.PRODUCT_VIEW:
      return 'primary';
    case EventType.SEARCH:
      return 'info';
    case EventType.CLICK:
      return 'default';
    case EventType.SCROLL:
      return 'default';
    default:
      return 'default';
  }
};

export const EventsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['events', paginationModel.page, paginationModel.pageSize, search, eventTypeFilter],
    queryFn: () =>
      eventService.search({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        userId: search || undefined,
        eventType: eventTypeFilter as EventType || undefined,
      }),
  });

  const columns: GridColDef[] = [
    {
      field: 'eventId',
      headerName: 'Event ID',
      width: 180,
      renderCell: (params: GridRenderCellParams<Event>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.eventId?.slice(0, 12)}...
        </Typography>
      ),
    },
    {
      field: 'eventType',
      headerName: 'Type',
      width: 150,
      renderCell: (params: GridRenderCellParams<Event>) => (
        <Chip
          label={params.row.eventType?.replace(/_/g, ' ')}
          size="small"
          color={getEventColor(params.row.eventType)}
        />
      ),
    },
    {
      field: 'userId',
      headerName: 'User ID',
      width: 150,
      renderCell: (params: GridRenderCellParams<Event>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.userId?.slice(0, 10)}...
        </Typography>
      ),
    },
    {
      field: 'sessionId',
      headerName: 'Session ID',
      width: 150,
      renderCell: (params: GridRenderCellParams<Event>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.row.sessionId?.slice(0, 10)}...
        </Typography>
      ),
    },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'pageUrl',
      headerName: 'Page URL',
      width: 200,
      valueGetter: (params) => params.row?.pageUrl || 'N/A',
    },
    {
      field: 'device',
      headerName: 'Device',
      width: 100,
      valueGetter: (params) => params.row?.metadata?.device || 'N/A',
    },
    {
      field: 'browser',
      headerName: 'Browser',
      width: 100,
      valueGetter: (params) => params.row?.metadata?.browser || 'N/A',
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 100,
      valueGetter: (params) => params.row?.metadata?.country || 'N/A',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and search through event data
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
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventTypeFilter}
                label="Event Type"
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="SESSION_START">Session Start</MenuItem>
                <MenuItem value="SESSION_END">Session End</MenuItem>
                <MenuItem value="PAGE_VIEW">Page View</MenuItem>
                <MenuItem value="PRODUCT_VIEW">Product View</MenuItem>
                <MenuItem value="ADD_TO_CART">Add to Cart</MenuItem>
                <MenuItem value="REMOVE_FROM_CART">Remove from Cart</MenuItem>
                <MenuItem value="PURCHASE">Purchase</MenuItem>
                <MenuItem value="SEARCH">Search</MenuItem>
                <MenuItem value="CLICK">Click</MenuItem>
                <MenuItem value="SCROLL">Scroll</MenuItem>
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
