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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Snackbar,
  Pagination,
  TextField
} from '@mui/material';
import { 
  Person, 
  Work, 
  MoreVert,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  HowToReg
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CompanyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    minScore: 0
  });

  const [hireData, setHireData] = useState({
    position: '',
    salary: '',
    startDate: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [page, filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.minScore > 0) queryParams.append('minScore', filters.minScore);
      queryParams.append('page', page);
      queryParams.append('limit', '10');

      const response = await api.get(`/company/applications?${queryParams}`);
      
      if (response.data.success) {
        setApplications(response.data.data.applications || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(response.data.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      // Create demo data for testing
      const demoApplications = [
        {
          id: '1',
          studentName: 'John Doe',
          studentEmail: 'john.doe@student.com',
          jobTitle: 'Software Developer',
          department: 'Engineering',
          qualificationScore: 85,
          appliedAt: new Date().toISOString(),
          status: 'pending',
          coverLetter: 'I am very interested in this position and believe my skills match your requirements perfectly.'
        },
        {
          id: '2',
          studentName: 'Sarah Smith',
          studentEmail: 'sarah.smith@student.com',
          jobTitle: 'Marketing Intern',
          department: 'Marketing',
          qualificationScore: 72,
          appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'shortlisted',
          coverLetter: 'I have experience in digital marketing and social media management.'
        }
      ];
      setApplications(demoApplications);
      setTotalPages(1);
      setError('Using demo data - Backend connection issue');
    } finally {
      setLoading(false);
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

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await api.patch(`/company/applications/${applicationId}/status`, {
        status,
        notes: `Status changed to ${status}`
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Application ${status} successfully`,
          severity: 'success'
        });
        fetchApplications();
        setDetailDialogOpen(false);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating application status: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleHireCandidate = (application) => {
    setSelectedApplication(application);
    setHireData({
      position: application.jobTitle || '',
      salary: '',
      startDate: ''
    });
    setHireDialogOpen(true);
  };

  const acceptCandidate = async () => {
    try {
      const response = await api.patch(`/company/applications/${selectedApplication.id}/status`, {
        status: 'hired',
        notes: 'Candidate hired for position'
      });
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Candidate hired successfully!',
          severity: 'success'
        });
        setHireDialogOpen(false);
        fetchApplications();
        setDetailDialogOpen(false);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error hiring candidate: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending Review' },
      reviewed: { color: 'info', label: 'Under Review' },
      shortlisted: { color: 'success', label: 'Shortlisted' },
      rejected: { color: 'error', label: 'Rejected' },
      hired: { color: 'success', label: 'Hired' },
      interview: { color: 'primary', label: 'Interview' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getQualificationColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
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
        Job Applications
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Review and manage job applications from qualified candidates
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" gutterBottom>
                Filter by Status:
              </Typography>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc' 
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" gutterBottom>
                Minimum Qualification Score:
              </Typography>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <Typography variant="body2" color="textSecondary">
                {filters.minScore}% and above
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ status: 'all', minScore: 0 })}
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
                  <TableCell>Candidate</TableCell>
                  <TableCell>Job Position</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Qualification Score</TableCell>
                  <TableCell>Applied On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length > 0 ? applications.map((application) => (
                  <TableRow key={application.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {application.studentName || 'Unknown Student'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {application.studentEmail || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Work sx={{ mr: 1, color: 'secondary.main', fontSize: 16 }} />
                        <Typography variant="body2">
                          {application.jobTitle || 'Unknown Position'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{application.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${application.qualificationScore || 0}%`}
                        color={getQualificationColor(application.qualificationScore || 0)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown date'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(application.status || 'pending')}
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        No applications found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
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

      {/* Application Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details - {selectedApplication?.studentName || 'Unknown Candidate'}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Candidate Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedApplication.studentName || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedApplication.studentEmail || 'No email'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Applied For:</strong> {selectedApplication.jobTitle || 'Unknown Position'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Department:</strong> {selectedApplication.department || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Qualification Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color={getQualificationColor(selectedApplication.qualificationScore || 0)}>
                          {selectedApplication.qualificationScore || 0}%
                        </Typography>
                        <Typography variant="body2">Overall Match</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {selectedApplication.academicPerformance?.averageGPA || 'N/A'}
                        </Typography>
                        <Typography variant="body2">GPA Score</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {selectedApplication.certificatesCount || 0}
                        </Typography>
                        <Typography variant="body2">Certificates</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Cover Letter</Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2">
                      {selectedApplication.coverLetter || 'No cover letter provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {selectedApplication?.status !== 'shortlisted' && selectedApplication?.status !== 'hired' && (
            <Button 
              onClick={() => updateApplicationStatus(selectedApplication.id, 'shortlisted')}
              variant="outlined" 
              color="success"
              startIcon={<CheckCircle />}
            >
              Shortlist
            </Button>
          )}
          {selectedApplication?.status !== 'rejected' && selectedApplication?.status !== 'hired' && (
            <Button 
              onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
              variant="outlined" 
              color="error"
              startIcon={<Cancel />}
            >
              Reject
            </Button>
          )}
          {selectedApplication?.status === 'shortlisted' && selectedApplication?.status !== 'hired' && (
            <Button 
              onClick={() => handleHireCandidate(selectedApplication)}
              variant="contained" 
              color="success"
              startIcon={<HowToReg />}
            >
              Hire Candidate
            </Button>
          )}
          {selectedApplication?.status === 'hired' && (
            <Chip label="Already Hired" color="success" />
          )}
        </DialogActions>
      </Dialog>

      {/* Hire Candidate Dialog */}
      <Dialog open={hireDialogOpen} onClose={() => setHireDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Hire {selectedApplication?.studentName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to hire {selectedApplication?.studentName} for the position of {selectedApplication?.jobTitle}.
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Position"
                value={hireData.position}
                onChange={(e) => setHireData({ ...hireData, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salary Offer"
                value={hireData.salary}
                onChange={(e) => setHireData({ ...hireData, salary: e.target.value })}
                placeholder="e.g., M15,000 per month"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={hireData.startDate}
                onChange={(e) => setHireData({ ...hireData, startDate: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={acceptCandidate}
            variant="contained" 
            color="success"
            startIcon={<HowToReg />}
          >
            Confirm Hire
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedApplication)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedApplication?.status !== 'shortlisted' && selectedApplication?.status !== 'hired' && (
          <MenuItem onClick={() => updateApplicationStatus(selectedApplication?.id, 'shortlisted')}>
            <CheckCircle sx={{ mr: 1 }} />
            Shortlist
          </MenuItem>
        )}
        {selectedApplication?.status !== 'rejected' && selectedApplication?.status !== 'hired' && (
          <MenuItem onClick={() => updateApplicationStatus(selectedApplication?.id, 'rejected')}>
            <Cancel sx={{ mr: 1 }} />
            Reject
          </MenuItem>
        )}
        {selectedApplication?.status === 'shortlisted' && selectedApplication?.status !== 'hired' && (
          <MenuItem onClick={() => handleHireCandidate(selectedApplication)}>
            <HowToReg sx={{ mr: 1 }} />
            Hire Candidate
          </MenuItem>
        )}
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

export default CompanyApplications;