import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
  Pagination
} from '@mui/material';
import {
  Business,
  TrendingUp,
  Schedule,
  LocationOn,
  Work,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyDialog, setApplyDialog] = useState({ open: false, job: null });
  const [coverLetter, setCoverLetter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    jobType: 'all',
    location: 'all'
  });

  useEffect(() => {
    fetchJobs();
  }, [filters, page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== '') {
          queryParams.append(key, value);
        }
      });
      queryParams.append('page', page);
      queryParams.append('limit', '6');

      const response = await api.get(`/student/jobs?${queryParams}`);
      if (response.data.success) {
        setJobs(response.data.data.jobs || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to load jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      const response = await api.post('/student/job-applications', {
        jobId: applyDialog.job.id,
        coverLetter: coverLetter || 'I am interested in this position and believe my qualifications are a good match.'
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Application submitted successfully!',
          severity: 'success'
        });
        setApplyDialog({ open: false, job: null });
        setCoverLetter('');
        fetchJobs(); // Refresh to update application status
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to submit application',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error submitting application',
        severity: 'error'
      });
    }
  };

  const getActionButton = (job) => {
    if (job.hasApplied) {
      return (
        <Button variant="outlined" disabled size="small">
          Already Applied
        </Button>
      );
    }

    if (job.isQualified === false) {
      return (
        <Button variant="outlined" disabled size="small">
          Not Qualified
        </Button>
      );
    }

    const now = new Date();
    const deadline = new Date(job.deadline);
    if (deadline < now) {
      return (
        <Button variant="outlined" disabled size="small">
          Deadline Passed
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        size="small"
        onClick={() => setApplyDialog({ open: true, job })}
      >
        Apply Now
      </Button>
    );
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getQualificationColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
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
        Job Opportunities
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Browse and apply for jobs matching your profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Jobs"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Job title, company, keywords..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={filters.jobType}
                  label="Job Type"
                  onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, country..."
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                onClick={() => setFilters({
                  search: '',
                  jobType: 'all',
                  location: 'all'
                })}
                fullWidth
                sx={{ height: '56px' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: job.hasApplied ? '2px solid' : '1px solid',
                borderColor: job.hasApplied ? 'primary.main' : 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {job.companyName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {job.department}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    {job.hasApplied && (
                      <Chip label="Applied" color="success" size="small" />
                    )}
                    <Chip 
                      label={`${job.qualificationScore || 0}% Match`} 
                      color={getQualificationColor(job.qualificationScore || 0)} 
                      size="small" 
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2, minHeight: '60px' }}>
                  {job.description?.substring(0, 150)}...
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {job.location}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {job.jobType}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {job.requirements && job.requirements.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Requirements:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {job.requirements.slice(0, 4).map((requirement, index) => (
                        <Chip key={index} label={requirement} size="small" variant="outlined" />
                      ))}
                      {job.requirements.length > 4 && (
                        <Chip label={`+${job.requirements.length - 4} more`} size="small" />
                      )}
                    </Box>
                  </Box>
                )}

                {job.salaryRange && (
                  <Typography variant="body2" color="primary" gutterBottom fontWeight="bold">
                    Salary: M{job.salaryRange.min?.toLocaleString()} - M{job.salaryRange.max?.toLocaleString()}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </Typography>
                  {getActionButton(job)}
                </Box>

                {job.isQualified === false && (
                  <Alert severity="warning" sx={{ mt: 1 }} size="small">
                    You don't meet all qualifications for this position
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}

      {jobs.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No jobs found matching your criteria
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setFilters({
              search: '',
              jobType: 'all',
              location: 'all'
            })}
          >
            Clear Filters
          </Button>
        </Box>
      )}

      {/* Application Dialog */}
      <Dialog open={applyDialog.open} onClose={() => setApplyDialog({ open: false, job: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          Apply for {applyDialog.job?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {applyDialog.job?.companyName} • {applyDialog.job?.location}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Your Qualification Match:</strong> {applyDialog.job?.qualificationScore || 0}%
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <strong>Cover Letter *</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write your cover letter here..."
            variant="outlined"
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Make sure your profile and documents are up to date before applying. 
              Your application will be reviewed along with your uploaded transcripts and certificates.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialog({ open: false, job: null })}>Cancel</Button>
          <Button 
            onClick={handleApply}
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Submit Application
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

export default StudentJobs;