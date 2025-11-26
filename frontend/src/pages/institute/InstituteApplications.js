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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Grid,
  LinearProgress,
  Snackbar,
  Pagination,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Download,
  Visibility,
  School
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InstituteApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionDialog, setActionDialog] = useState({ open: false, application: null, action: '' });
  const [detailDialog, setDetailDialog] = useState({ open: false, application: null });
  const [notes, setNotes] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    courseId: 'all'
  });

  useEffect(() => {
    fetchApplications();
    fetchCourses();
  }, [page, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.courseId !== 'all') queryParams.append('courseId', filters.courseId);
      queryParams.append('page', page);
      queryParams.append('limit', '10');

      const response = await api.get(`/institute/applications?${queryParams}`);
      console.log('📋 Applications response:', response.data);
      
      if (response.data.success) {
        const validApplications = response.data.data.applications.filter(app => 
          app && app.id && app.courseId && app.studentName
        );
        setApplications(validApplications);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Error loading applications: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/institute/courses');
      if (response.data.success) {
        setCourses(response.data.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleMenuOpen = (event, application) => {
    setAnchorEl(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedApplication(null);
  };

  // CRITICAL FIX: Simplified status update function
  const handleStatusUpdate = async (applicationId, status) => {
    try {
      console.log(`🔄 Updating application ${applicationId} to ${status}`);
      
      const payload = {
        status: status
      };

      // Add notes only if provided
      if (notes && notes.trim() !== '') {
        payload.notes = notes.trim();
      }

      console.log('📤 Sending payload:', payload);

      const response = await api.patch(`/institute/applications/${applicationId}/status`, payload);
      console.log('✅ Update response:', response.data);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Application ${status} successfully`,
          severity: 'success'
        });
        setActionDialog({ open: false, application: null, action: '' });
        setNotes('');
        
        // Refresh applications
        setTimeout(() => {
          fetchApplications();
        }, 500);
        
      } else {
        throw new Error(response.data.message || 'Failed to update application');
      }
    } catch (err) {
      console.error('❌ Error updating application status:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error updating application status';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailDialog({ open: true, application });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Review' },
      admitted: { color: 'success', label: 'Admitted' },
      rejected: { color: 'error', label: 'Rejected' },
      waiting_list: { color: 'info', label: 'Waiting List' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const openActionDialog = (application, action) => {
    setActionDialog({ open: true, application, action });
    setNotes('');
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const canAdmitStudent = (application) => {
    if (!application || !application.courseId) {
      return false;
    }

    const course = courses.find(c => c && c.id === application.courseId);
    if (!course) {
      return false;
    }

    return course.currentStudents < course.maxStudents;
  };

  const isValidApplication = (application) => {
    return application && application.id && application.courseId && application.studentName;
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
        Student Applications
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Review and manage student applications for your courses
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Filter by Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="admitted">Admitted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="waiting_list">Waiting List</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Course</InputLabel>
                <Select
                  value={filters.courseId}
                  label="Filter by Course"
                  onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ status: 'all', courseId: 'all' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell>Applied On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.filter(isValidApplication).map((application) => (
                  <TableRow key={application.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {application.studentName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {application.studentEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {application.courseName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {application.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{application.facultyName}</TableCell>
                    <TableCell>
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(application.status)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, application)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, application: null, action: '' })}>
        <DialogTitle>
          {actionDialog.action === 'admit' ? 'Admit Student' : 
           actionDialog.action === 'reject' ? 'Reject Application' :
           'Update Application Status'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Student: <strong>{actionDialog.application?.studentName}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Course: <strong>{actionDialog.application?.courseName}</strong>
          </Typography>
          
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add any notes or comments about this decision..."
          />

          {actionDialog.action === 'admit' && actionDialog.application && !canAdmitStudent(actionDialog.application) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This course has reached its maximum capacity. You cannot admit more students.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, application: null, action: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleStatusUpdate(actionDialog.application.id, actionDialog.action)}
            variant="contained"
            color={actionDialog.action === 'admit' ? 'success' : actionDialog.action === 'reject' ? 'error' : 'primary'}
            disabled={actionDialog.action === 'admit' && actionDialog.application && !canAdmitStudent(actionDialog.application)}
          >
            Confirm {actionDialog.action}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); handleViewDetails(selectedApplication); }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={() => openActionDialog(selectedApplication, 'admit')}
          disabled={!selectedApplication || !canAdmitStudent(selectedApplication)}
        >
          <CheckCircle sx={{ mr: 1 }} />
          Admit Student
        </MenuItem>
        <MenuItem onClick={() => openActionDialog(selectedApplication, 'reject')}>
          <Cancel sx={{ mr: 1 }} />
          Reject Application
        </MenuItem>
        <MenuItem onClick={() => openActionDialog(selectedApplication, 'waiting_list')}>
          <Schedule sx={{ mr: 1 }} />
          Move to Waiting List
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default InstituteApplications;