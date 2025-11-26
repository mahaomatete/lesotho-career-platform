import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  LinearProgress,
  Snackbar,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Block,
  Business,
  Edit,
  Delete,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminCompanies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    industry: '',
    companySize: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    contactPerson: {
      firstName: '',
      lastName: '',
      position: '',
      email: '',
      phone: ''
    }
  });

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/companies?page=${page}&limit=10`);
      if (response.data.success) {
        setCompanies(response.data.data.companies);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Failed to load companies');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, company) => {
    setAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleApprove = async (companyId) => {
    try {
      const response = await api.post(`/admin/approve/${companyId}`, {
        type: 'company'
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Company approved successfully',
          severity: 'success'
        });
        fetchCompanies();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error approving company',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleSuspend = async (companyId, isActive) => {
    try {
      const response = await api.patch(`/admin/companies/${companyId}/status`, {
        isActive: !isActive
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Company ${!isActive ? 'activated' : 'suspended'} successfully`,
          severity: 'success'
        });
        fetchCompanies();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating company status',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleDelete = async (companyId) => {
    try {
      const response = await api.delete(`/admin/companies/${companyId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Company deleted successfully',
          severity: 'success'
        });
        fetchCompanies();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error deleting company',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleAddCompany = async () => {
    try {
      const response = await api.post('/admin/companies', formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Company added successfully',
          severity: 'success'
        });
        setDialogOpen(false);
        resetForm();
        fetchCompanies();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error adding company',
        severity: 'error'
      });
    }
  };

  const handleEditCompany = async () => {
    try {
      const response = await api.put(`/admin/companies/${selectedCompany.id}`, formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Company updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        resetForm();
        fetchCompanies();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating company',
        severity: 'error'
      });
    }
  };

  const openEditDialog = (company) => {
    setSelectedCompany(company);
    setFormData({
      companyName: company.companyName,
      email: company.email,
      password: '', // Don't pre-fill password for security
      industry: company.industry || '',
      companySize: company.companySize || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
      description: company.description || '',
      contactPerson: company.contactPerson || {
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: ''
      }
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      email: '',
      password: '',
      industry: '',
      companySize: '',
      phone: '',
      website: '',
      address: '',
      description: '',
      contactPerson: {
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: ''
      }
    });
  };

  const getStatusChip = (company) => {
    if (!company.isApproved) {
      return <Chip label="Pending Approval" color="warning" size="small" />;
    }
    if (!company.isActive) {
      return <Chip label="Suspended" color="error" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
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
          Manage Companies
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Company
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Jobs</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Business sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {company.companyName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {company.industry}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>
                      <Chip 
                        label={company.stats?.totalJobs || 0} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.stats?.totalApplications || 0} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChip(company)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, company)}
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

      {/* Add Company Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name *"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry *</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry *"
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="Retail">Retail</MenuItem>
                  <MenuItem value="Hospitality">Hospitality</MenuItem>
                  <MenuItem value="Construction">Construction</MenuItem>
                  <MenuItem value="Agriculture">Agriculture</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={formData.companySize}
                  label="Company Size"
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                >
                  <MenuItem value="1-10">1-10 employees</MenuItem>
                  <MenuItem value="11-50">11-50 employees</MenuItem>
                  <MenuItem value="51-200">51-200 employees</MenuItem>
                  <MenuItem value="201-500">201-500 employees</MenuItem>
                  <MenuItem value="501-1000">501-1000 employees</MenuItem>
                  <MenuItem value="1000+">1000+ employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            
            {/* Contact Person */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Person
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.contactPerson.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, firstName: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.contactPerson.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, lastName: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.contactPerson.position}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, position: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactPerson.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPerson.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, phone: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCompany} variant="contained">
            Add Company
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Company</DialogTitle>
        <DialogContent>
          {/* Same form structure as Add Company Dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name *"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
            {/* ... rest of the form fields same as Add Company Dialog ... */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCompany} variant="contained">
            Update Company
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {!selectedCompany?.isApproved && (
          <MenuItem onClick={() => handleApprove(selectedCompany?.id)}>
            <CheckCircle sx={{ mr: 1 }} />
            Approve
          </MenuItem>
        )}
        <MenuItem onClick={() => handleSuspend(selectedCompany?.id, selectedCompany?.isActive)}>
          <Block sx={{ mr: 1 }} />
          {selectedCompany?.isActive ? 'Suspend' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); openEditDialog(selectedCompany); }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedCompany?.id)}>
          <Delete sx={{ mr: 1 }} />
          Delete
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

export default AdminCompanies;