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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  School,
  Business,
  Cancel,
  Download,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawDialog, setWithdrawDialog] = useState({ open: false, application: null });
  const [acceptDialog, setAcceptDialog] = useState({ open: false, application: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/applications');
      if (response.data.success) {
        setApplications(response.data.data.applications || []);
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    try {
      const response = await api.delete(`/student/applications/${applicationId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Application withdrawn successfully',
          severity: 'success'
        });
        setWithdrawDialog({ open: false, application: null });
        fetchApplications();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error withdrawing application',
        severity: 'error'
      });
    }
  };

  const handleAcceptOffer = async (applicationId) => {
    try {
      const response = await api.put(`/student/applications/${applicationId}/accept`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Offer accepted successfully!',
          severity: 'success'
        });
        setAcceptDialog({ open: false, application: null });
        fetchApplications();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error accepting offer',
        severity: 'error'
      });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Under Review' },
      admitted: { color: 'success', label: 'Admitted' },
      rejected: { color: 'error', label: 'Not Admitted' },
      waiting_list: { color: 'info', label: 'Waiting List' },
      accepted: { color: 'success', label: 'Offer Accepted' },
      withdrawn: { color: 'default', label: 'Withdrawn' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} />;
  };

  const canWithdraw = (application) => {
    return application.status === 'pending' || application.status === 'waiting_list';
  };

  const canAccept = (application) => {
    return application.status === 'admitted';
  };

  const getActionButton = (application) => {
    if (application.status === 'admitted') {
      return (
        <Button 
          variant="contained" 
          color="success" 
          size="small"
          onClick={() => setAcceptDialog({ open: true, application })}
          startIcon={<CheckCircle />}
        >
          Accept Offer
        </Button>
      );
    } else if (canWithdraw(application)) {
      return (
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          onClick={() => setWithdrawDialog({ open: true, application })}
          startIcon={<Cancel />}
        >
          Withdraw
        </Button>
      );
    }
    return null;
  };

  const downloadAdmissionLetter = async (applicationId) => {
    try {
      const response = await api.get(`/student/applications/${applicationId}/admission-letter`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admission-letter-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error downloading admission letter',
        severity: 'error'
      });
    }
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
        My Applications
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Track the status of your course applications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {applications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Applications Yet
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              You haven't applied to any courses yet.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/student/courses'}
            >
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course & Institution</TableCell>
                    <TableCell>Faculty</TableCell>
                    <TableCell>Applied On</TableCell>
                    <TableCell>Tuition Fee</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle1">
                            {application.courseName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {application.instituteName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {application.courseCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{application.facultyName}</TableCell>
                      <TableCell>
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        M{application.tuitionFee?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(application.deadline).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(application.status)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          {getActionButton(application)}
                          {application.status === 'admitted' && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Download />}
                              onClick={() => downloadAdmissionLetter(application.id)}
                            >
                              Admission Letter
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Application Statistics */}
      {applications.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {applications.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {applications.filter(app => app.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Under Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {applications.filter(app => app.status === 'admitted').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Admitted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {applications.filter(app => app.status === 'waiting_list').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Waiting List
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog.open} onClose={() => setWithdrawDialog({ open: false, application: null })}>
        <DialogTitle>Withdraw Application</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to withdraw your application for:
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {withdrawDialog.application?.courseName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {withdrawDialog.application?.instituteName}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. You will need to reapply if you change your mind.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog({ open: false, application: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleWithdraw(withdrawDialog.application.id)}
            variant="contained" 
            color="error"
          >
            Withdraw Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept Offer Dialog */}
      <Dialog open={acceptDialog.open} onClose={() => setAcceptDialog({ open: false, application: null })}>
        <DialogTitle>Accept Admission Offer</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Congratulations! You are accepting the admission offer for:
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {acceptDialog.application?.courseName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {acceptDialog.application?.instituteName}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> By accepting this offer, you automatically decline any other admission offers you may have received.
              This action cannot be reversed.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialog({ open: false, application: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAcceptOffer(acceptDialog.application.id)}
            variant="contained" 
            color="success"
            startIcon={<CheckCircle />}
          >
            Accept Offer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default StudentApplications;