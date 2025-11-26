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
  Grid,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Snackbar,
  Pagination
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Work,
  Business,
  Visibility,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CompanyJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    qualifications: {
      minEducation: '',
      requiredSkills: [''],
      minExperience: '',
      minGPA: ''
    },
    location: '',
    jobType: 'full-time',
    workType: 'on-site',
    salaryRange: {
      min: '',
      max: '',
      currency: 'LSL'
    },
    deadline: '',
    positionsAvailable: '',
    experienceLevel: 'entry'
  });

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/company/jobs?page=${page}&limit=10`);
      if (response.data.success) {
        setJobs(response.data.data.jobs || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Error loading jobs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleAddJob = async () => {
    try {
      const jobData = {
        ...formData,
        positionsAvailable: parseInt(formData.positionsAvailable),
        salaryRange: {
          min: parseFloat(formData.salaryRange.min),
          max: parseFloat(formData.salaryRange.max),
          currency: formData.salaryRange.currency
        },
        deadline: new Date(formData.deadline).toISOString(),
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
        qualifications: {
          ...formData.qualifications,
          requiredSkills: formData.qualifications.requiredSkills.filter(skill => skill.trim() !== ''),
          minGPA: formData.qualifications.minGPA ? parseFloat(formData.qualifications.minGPA) : null
        }
      };

      const response = await api.post('/company/jobs', jobData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job posted successfully! Qualified students will be notified.',
          severity: 'success'
        });
        setDialogOpen(false);
        resetForm();
        fetchJobs();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating job posting',
        severity: 'error'
      });
    }
  };

  const handleEditJob = async () => {
    try {
      const jobData = {
        ...formData,
        positionsAvailable: parseInt(formData.positionsAvailable),
        salaryRange: {
          min: parseFloat(formData.salaryRange.min),
          max: parseFloat(formData.salaryRange.max),
          currency: formData.salaryRange.currency
        },
        deadline: new Date(formData.deadline).toISOString(),
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
        qualifications: {
          ...formData.qualifications,
          requiredSkills: formData.qualifications.requiredSkills.filter(skill => skill.trim() !== ''),
          minGPA: formData.qualifications.minGPA ? parseFloat(formData.qualifications.minGPA) : null
        }
      };

      const response = await api.put(`/company/jobs/${selectedJob.id}`, jobData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job updated successfully!',
          severity: 'success'
        });
        setEditDialogOpen(false);
        resetForm();
        fetchJobs();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating job posting: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      const response = await api.patch(`/company/jobs/${jobId}/close`, {
        reason: 'Closed by company'
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job closed successfully',
          severity: 'success'
        });
        fetchJobs();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error closing job: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleDeleteJob = async (jobId) => {
    try {
      // Note: Your backend doesn't have a delete endpoint, so we'll close it instead
      const response = await api.patch(`/company/jobs/${jobId}/close`, {
        reason: 'Deleted by company'
      });
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Job removed successfully',
          severity: 'success'
        });
        fetchJobs();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error removing job: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleViewApplications = (jobId) => {
    // Navigate to applications page filtered by this job
    window.location.href = `/company/applications?jobId=${jobId}`;
    handleMenuClose();
  };

  const openEditDialog = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title || '',
      department: job.department || '',
      description: job.description || '',
      requirements: job.requirements && job.requirements.length > 0 ? job.requirements : [''],
      responsibilities: job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : [''],
      qualifications: {
        minEducation: job.qualifications?.minEducation || '',
        requiredSkills: job.qualifications?.requiredSkills?.length > 0 ? job.qualifications.requiredSkills : [''],
        minExperience: job.qualifications?.minExperience || '',
        minGPA: job.qualifications?.minGPA || ''
      },
      location: job.location || '',
      jobType: job.jobType || 'full-time',
      workType: job.workType || 'on-site',
      salaryRange: {
        min: job.salaryRange?.min || '',
        max: job.salaryRange?.max || '',
        currency: job.salaryRange?.currency || 'LSL'
      },
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      positionsAvailable: job.positionsAvailable || '',
      experienceLevel: job.experienceLevel || 'entry'
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      description: '',
      requirements: [''],
      responsibilities: [''],
      qualifications: {
        minEducation: '',
        requiredSkills: [''],
        minExperience: '',
        minGPA: ''
      },
      location: '',
      jobType: 'full-time',
      workType: 'on-site',
      salaryRange: {
        min: '',
        max: '',
        currency: 'LSL'
      },
      deadline: '',
      positionsAvailable: '',
      experienceLevel: 'entry'
    });
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, '']
    });
  };

  const updateRequirement = (index, value) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData({ ...formData, requirements: newRequirements });
  };

  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: newRequirements });
  };

  const addResponsibility = () => {
    setFormData({
      ...formData,
      responsibilities: [...formData.responsibilities, '']
    });
  };

  const updateResponsibility = (index, value) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = value;
    setFormData({ ...formData, responsibilities: newResponsibilities });
  };

  const removeResponsibility = (index) => {
    const newResponsibilities = formData.responsibilities.filter((_, i) => i !== index);
    setFormData({ ...formData, responsibilities: newResponsibilities });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      qualifications: {
        ...formData.qualifications,
        requiredSkills: [...formData.qualifications.requiredSkills, '']
      }
    });
  };

  const updateSkill = (index, value) => {
    const newSkills = [...formData.qualifications.requiredSkills];
    newSkills[index] = value;
    setFormData({
      ...formData,
      qualifications: {
        ...formData.qualifications,
        requiredSkills: newSkills
      }
    });
  };

  const removeSkill = (index) => {
    const newSkills = formData.qualifications.requiredSkills.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      qualifications: {
        ...formData.qualifications,
        requiredSkills: newSkills
      }
    });
  };

  const getStatusChip = (job) => {
    if (job.status === 'active') {
      return <Chip label="Active" color="success" size="small" />;
    } else if (job.status === 'closed') {
      return <Chip label="Closed" color="default" size="small" />;
    } else if (job.status === 'draft') {
      return <Chip label="Draft" color="warning" size="small" />;
    }
    return <Chip label="Expired" color="error" size="small" />;
  };

  const getCapacityColor = (job) => {
    if (!job.positionsAvailable || job.positionsAvailable === 0) return 'default';
    const percentage = ((job.positionsFilled || 0) / job.positionsAvailable) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
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
          Manage Job Postings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Post New Job
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Positions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length > 0 ? jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Work sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {job.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>
                      <Chip 
                        label={job.jobType} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Total: {job.applicationsCount || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${job.positionsFilled || 0}/${job.positionsAvailable}`}
                        color={getCapacityColor(job)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChip(job)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, job)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        No job postings found
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        sx={{ mt: 1 }}
                        onClick={() => setDialogOpen(true)}
                      >
                        Create Your First Job Posting
                      </Button>
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

      {/* Add Job Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Post New Job</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department *"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description *"
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
                label="Location *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type *</InputLabel>
                <Select
                  value={formData.jobType}
                  label="Job Type *"
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                >
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Work Type</InputLabel>
                <Select
                  value={formData.workType}
                  label="Work Type"
                  onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                >
                  <MenuItem value="on-site">On-site</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={formData.experienceLevel}
                  label="Experience Level"
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                >
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">Mid Level</MenuItem>
                  <MenuItem value="senior">Senior Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Salary Min (M) *"
                type="number"
                value={formData.salaryRange.min}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  salaryRange: { ...formData.salaryRange, min: e.target.value } 
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Salary Max (M) *"
                type="number"
                value={formData.salaryRange.max}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  salaryRange: { ...formData.salaryRange, max: e.target.value } 
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Positions Available *"
                type="number"
                value={formData.positionsAvailable}
                onChange={(e) => setFormData({ ...formData, positionsAvailable: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Application Deadline *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Minimum Education</InputLabel>
                <Select
                  value={formData.qualifications.minEducation}
                  label="Minimum Education"
                  onChange={(e) => setFormData({
                    ...formData,
                    qualifications: { ...formData.qualifications, minEducation: e.target.value }
                  })}
                >
                  <MenuItem value="High School">High School</MenuItem>
                  <MenuItem value="Diploma">Diploma</MenuItem>
                  <MenuItem value="Bachelor's Degree">Bachelor's Degree</MenuItem>
                  <MenuItem value="Master's Degree">Master's Degree</MenuItem>
                  <MenuItem value="PhD">PhD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Experience"
                value={formData.qualifications.minExperience}
                onChange={(e) => setFormData({
                  ...formData,
                  qualifications: { ...formData.qualifications, minExperience: e.target.value }
                })}
                placeholder="e.g., 2-3 years"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum GPA (Optional)"
                type="number"
                step="0.1"
                min="0"
                max="4.0"
                value={formData.qualifications.minGPA}
                onChange={(e) => setFormData({
                  ...formData,
                  qualifications: { ...formData.qualifications, minGPA: e.target.value }
                })}
                placeholder="e.g., 3.0"
              />
            </Grid>

            {/* Requirements */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Requirements *
              </Typography>
              {formData.requirements.map((requirement, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={requirement}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Enter requirement"
                    required
                  />
                  <Button
                    color="error"
                    onClick={() => removeRequirement(index)}
                    disabled={formData.requirements.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button onClick={addRequirement} variant="outlined">
                Add Requirement
              </Button>
            </Grid>

            {/* Responsibilities */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Responsibilities *
              </Typography>
              {formData.responsibilities.map((responsibility, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder="Enter responsibility"
                    required
                  />
                  <Button
                    color="error"
                    onClick={() => removeResponsibility(index)}
                    disabled={formData.responsibilities.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button onClick={addResponsibility} variant="outlined">
                Add Responsibility
              </Button>
            </Grid>

            {/* Required Skills */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Required Skills *
              </Typography>
              {formData.qualifications.requiredSkills.map((skill, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={skill}
                    onChange={(e) => updateSkill(index, e.target.value)}
                    placeholder="Enter required skill"
                    required
                  />
                  <Button
                    color="error"
                    onClick={() => removeSkill(index)}
                    disabled={formData.qualifications.requiredSkills.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button onClick={addSkill} variant="outlined">
                Add Skill
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddJob} variant="contained" startIcon={<CheckCircle />}>
            Post Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Job Posting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department *"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description *"
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
                label="Location *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type *</InputLabel>
                <Select
                  value={formData.jobType}
                  label="Job Type *"
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                >
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="internship">Internship</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Include other form fields as in Add Job Dialog */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditJob} variant="contained" startIcon={<CheckCircle />}>
            Update Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewApplications(selectedJob?.id)}>
          <Visibility sx={{ mr: 1 }} />
          View Applications
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); openEditDialog(selectedJob); }}>
          <Edit sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        {selectedJob?.status === 'active' && (
          <MenuItem onClick={() => handleCloseJob(selectedJob?.id)}>
            <Delete sx={{ mr: 1 }} />
            Close Job
          </MenuItem>
        )}
        {selectedJob?.status === 'closed' && (
          <MenuItem onClick={() => handleDeleteJob(selectedJob?.id)}>
            <Delete sx={{ mr: 1 }} />
            Delete Job
          </MenuItem>
        )}
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

export default CompanyJobs;