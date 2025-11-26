import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  LinearProgress,
  Snackbar,
  Pagination,
  Grid
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Business,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InstituteFaculties = () => {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dean: '',
    contactEmail: '',
    phone: '',
    status: 'active'
  });

  useEffect(() => {
    fetchFaculties();
  }, [page]);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/institute/faculties?page=${page}&limit=10`);
      if (response.data.success) {
        setFaculties(response.data.data.faculties);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Failed to load faculties');
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Error loading faculties');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, faculty) => {
    setAnchorEl(event.currentTarget);
    setSelectedFaculty(faculty);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFaculty(null);
  };

  const handleAddFaculty = async () => {
    try {
      const response = await api.post('/institute/faculties', formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty created successfully!',
          severity: 'success'
        });
        setDialogOpen(false);
        resetForm();
        fetchFaculties();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating faculty',
        severity: 'error'
      });
    }
  };

  const handleEditFaculty = async () => {
    try {
      const response = await api.put(`/institute/faculties/${selectedFaculty.id}`, formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty updated successfully!',
          severity: 'success'
        });
        setEditDialogOpen(false);
        resetForm();
        fetchFaculties();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating faculty',
        severity: 'error'
      });
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    try {
      const response = await api.delete(`/institute/faculties/${facultyId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty deleted successfully',
          severity: 'success'
        });
        fetchFaculties();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error deleting faculty',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleToggleFacultyStatus = async (facultyId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await api.patch(`/institute/faculties/${facultyId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Faculty ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
        fetchFaculties();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating faculty status',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const openEditDialog = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      name: faculty.name,
      description: faculty.description,
      dean: faculty.dean,
      contactEmail: faculty.contactEmail,
      phone: faculty.phone || '',
      status: faculty.status
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dean: '',
      contactEmail: '',
      phone: '',
      status: 'active'
    });
  };

  const getStatusChip = (faculty) => {
    if (faculty.status === 'active') {
      return <Chip label="Active" color="success" size="small" />;
    }
    return <Chip label="Inactive" color="default" size="small" />;
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Manage Faculties
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Faculty
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Faculty Name</TableCell>
                  <TableCell>Dean</TableCell>
                  <TableCell>Contact Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Courses</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faculties.map((faculty) => (
                  <TableRow key={faculty.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Business sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {faculty.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {faculty.description?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{faculty.dean}</TableCell>
                    <TableCell>{faculty.contactEmail}</TableCell>
                    <TableCell>{faculty.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={faculty.stats?.totalCourses || 0} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={faculty.stats?.totalStudents || 0} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChip(faculty)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, faculty)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Faculty Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Faculty</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Faculty Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dean Name *"
                value={formData.dean}
                onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email *"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+266 ..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFaculty} variant="contained" startIcon={<CheckCircle />}>
            Create Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Faculty</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Faculty Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dean Name *"
                value={formData.dean}
                onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email *"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+266 ..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditFaculty} variant="contained" startIcon={<CheckCircle />}>
            Update Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); openEditDialog(selectedFaculty); }}>
          <Edit sx={{ mr: 1 }} />
          Edit Faculty
        </MenuItem>
        <MenuItem onClick={() => handleToggleFacultyStatus(selectedFaculty?.id, selectedFaculty?.status)}>
          {selectedFaculty?.status === 'active' ? (
            <>
              <Cancel sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => handleDeleteFaculty(selectedFaculty?.id)}>
          <Delete sx={{ mr: 1 }} />
          Delete Faculty
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default InstituteFaculties;