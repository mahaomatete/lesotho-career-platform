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
  Alert,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Pagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import { 
  Person, 
  MoreVert,
  Block,
  CheckCircle,
  Edit,
  School,
  Work
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/students?page=${page}&limit=10`);
      if (response.data.success) {
        setStudents(response.data.data.students);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudent(null);
  };

  const handleSuspend = async (studentId, isActive) => {
    try {
      const response = await api.patch(`/admin/students/${studentId}/status`, {
        isActive: !isActive
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Student ${!isActive ? 'activated' : 'suspended'} successfully`,
          severity: 'success'
        });
        fetchStudents();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating student status',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setDetailDialogOpen(true);
  };

  const getStatusChip = (student) => {
    if (!student.isActive) {
      return <Chip label="Suspended" color="error" size="small" />;
    }
    if (!student.isVerified) {
      return <Chip label="Unverified" color="warning" size="small" />;
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
      <Typography variant="h4" gutterBottom>
        Manage Students
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        View and manage student accounts and activities
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Admitted</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {student.firstName} {student.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {student.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={student.stats?.totalApplications || 0} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={student.stats?.admittedApplications || 0} 
                        color="success"
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {student.stats?.transcriptsUploaded > 0 && (
                          <Chip 
                            label={`${student.stats.transcriptsUploaded}T`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {student.stats?.certificatesUploaded > 0 && (
                          <Chip 
                            label={`${student.stats.certificatesUploaded}C`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(student)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, student)}
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

      {/* Student Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Student Details - {selectedStudent?.firstName} {selectedStudent?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Full Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedStudent.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedStudent.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Status:</strong> {getStatusChip(selectedStudent)}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Academic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <School sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">{selectedStudent.stats?.totalApplications || 0}</Typography>
                        <Typography variant="body2">Course Applications</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6">{selectedStudent.stats?.admittedApplications || 0}</Typography>
                        <Typography variant="body2">Admitted</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Career Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Work sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6">{selectedStudent.stats?.jobApplications || 0}</Typography>
                        <Typography variant="body2">Job Applications</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Person sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                        <Typography variant="h6">
                          {(selectedStudent.stats?.transcriptsUploaded || 0) + (selectedStudent.stats?.certificatesUploaded || 0)}
                        </Typography>
                        <Typography variant="body2">Documents</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {selectedStudent.lastLogin && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Last Login:</strong> {new Date(selectedStudent.lastLogin).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => handleSuspend(selectedStudent?.id, selectedStudent?.isActive)}
            variant="outlined"
            color={selectedStudent?.isActive ? "error" : "success"}
          >
            {selectedStudent?.isActive ? 'Suspend Account' : 'Activate Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); handleViewDetails(selectedStudent); }}>
          <Person sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleSuspend(selectedStudent?.id, selectedStudent?.isActive)}>
          {selectedStudent?.isActive ? (
            <>
              <Block sx={{ mr: 1 }} />
              Suspend Account
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} />
              Activate Account
            </>
          )}
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

export default AdminStudents;