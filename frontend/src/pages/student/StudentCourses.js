import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
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
  School,
  TrendingUp,
  Schedule,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    institutionId: 'all',
    faculty: 'all',
    minFee: '',
    maxFee: ''
  });

  const [applicationData, setApplicationData] = useState({
    personalStatement: '',
    additionalInfo: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchInstitutions();
    fetchFaculties();
  }, [filters, page]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.institutionId !== 'all') queryParams.append('institutionId', filters.institutionId);
      if (filters.faculty !== 'all') queryParams.append('faculty', filters.faculty);
      if (filters.minFee) queryParams.append('minFee', filters.minFee);
      if (filters.maxFee) queryParams.append('maxFee', filters.maxFee);
      queryParams.append('page', page);
      queryParams.append('limit', '6');
      
      const response = await api.get(`/student/courses?${queryParams}`);
      
      if (response.data.success) {
        setCourses(response.data.data.courses || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/student/institutions');
      if (response.data.success) {
        setInstitutions(response.data.data.institutions || []);
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/student/faculties');
      if (response.data.success) {
        setFaculties(response.data.data.faculties || []);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const handleApply = (course) => {
    setSelectedCourse(course);
    setApplicationData({
      personalStatement: '',
      additionalInfo: ''
    });
    setApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    try {
      if (!selectedCourse) return;

      const response = await api.post('/student/applications', {
        courseId: selectedCourse.id,
        personalStatement: applicationData.personalStatement,
        additionalInfo: applicationData.additionalInfo || {}
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Application submitted successfully!',
          severity: 'success'
        });
        setApplyDialogOpen(false);
        fetchCourses();
      } else {
        setError(response.data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      const errorMsg = err.response?.data?.message || 'Error submitting application';
      setError(errorMsg);
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    }
  };

  const getApplicationStatus = (course) => {
    if (course.hasApplied) {
      const statusConfig = {
        pending: { color: 'warning', label: 'Under Review' },
        admitted: { color: 'success', label: 'Admitted' },
        rejected: { color: 'error', label: 'Not Admitted' },
        waiting_list: { color: 'info', label: 'Waiting List' }
      };
      
      const config = statusConfig[course.applicationStatus] || { color: 'default', label: course.applicationStatus };
      return <Chip label={config.label} color={config.color} size="small" />;
    }
    return null;
  };

  const getActionButton = (course) => {
    if (course.hasApplied) {
      return (
        <Button variant="outlined" disabled size="small">
          Already Applied
        </Button>
      );
    }

    if (course.canApply === false) {
      return (
        <Button variant="outlined" disabled size="small">
          Not Qualified
        </Button>
      );
    }

    if (course.stats?.spotsLeft <= 0) {
      return (
        <Button variant="outlined" disabled size="small">
          Course Full
        </Button>
      );
    }

    const now = new Date();
    const deadline = new Date(course.deadline);
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
        onClick={() => handleApply(course)}
      >
        Apply Now
      </Button>
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
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
        Browse Available Courses
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Explore courses from various institutions and apply (maximum 2 courses per institution)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Search Courses"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by course name or code..."
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={filters.institutionId}
                  label="Institution"
                  onChange={(e) => setFilters({ ...filters, institutionId: e.target.value })}
                >
                  <MenuItem value="all">All Institutions</MenuItem>
                  {institutions.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={filters.faculty}
                  label="Faculty"
                  onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
                >
                  <MenuItem value="all">All Faculties</MenuItem>
                  {faculties.map((faculty) => (
                    <MenuItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Min Fee"
                type="number"
                value={filters.minFee}
                onChange={(e) => setFilters({ ...filters, minFee: e.target.value })}
                placeholder="Min"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Max Fee"
                type="number"
                value={filters.maxFee}
                onChange={(e) => setFilters({ ...filters, maxFee: e.target.value })}
                placeholder="Max"
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="outlined"
                onClick={() => setFilters({
                  search: '',
                  institutionId: 'all',
                  faculty: 'all',
                  minFee: '',
                  maxFee: ''
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

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} md={6} key={course.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: course.hasApplied ? '2px solid' : '1px solid',
                borderColor: course.hasApplied ? 'primary.main' : 'divider',
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
                      {course.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {course.code} • {course.instituteName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.facultyName}
                    </Typography>
                  </Box>
                  {getApplicationStatus(course)}
                </Box>

                <Typography variant="body2" sx={{ mb: 2, minHeight: '40px' }}>
                  {course.description?.length > 120 
                    ? `${course.description.substring(0, 120)}...` 
                    : course.description
                  }
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.duration} years
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        M{course.tuitionFee?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Applications: {course.stats?.totalApplications || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography 
                      variant="body2" 
                      color={(course.stats?.spotsLeft || 0) > 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {(course.stats?.spotsLeft || 0) > 0 ? `${course.stats.spotsLeft} spots left` : 'Course Full'}
                    </Typography>
                  </Grid>
                </Grid>

                {course.requirements && course.requirements.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }} size="small">
                    <Typography variant="subtitle2" gutterBottom>Requirements:</Typography>
                    <Typography variant="body2">
                      {course.requirements.join(', ')}
                    </Typography>
                  </Alert>
                )}

                {course.qualificationMessage && (
                  <Alert severity={course.canApply ? "success" : "warning"} sx={{ mb: 2 }} size="small">
                    {course.qualificationMessage}
                  </Alert>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Deadline: {new Date(course.deadline).toLocaleDateString()}
                  </Typography>
                  {getActionButton(course)}
                </Box>
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

      {courses.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            No courses found matching your criteria
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setFilters({
              search: '',
              institutionId: 'all',
              faculty: 'all',
              minFee: '',
              maxFee: ''
            })}
          >
            Clear Filters
          </Button>
        </Box>
      )}

      {/* Application Dialog */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Apply for {selectedCourse?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {selectedCourse?.instituteName} • {selectedCourse?.code}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Course Requirements:</strong> {selectedCourse?.requirements?.join(', ') || 'No specific requirements'}
            </Typography>
          </Alert>
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <strong>Personal Statement *</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={applicationData.personalStatement}
            onChange={(e) => setApplicationData({ ...applicationData, personalStatement: e.target.value })}
            placeholder="Explain why you are interested in this course and why you would be a good candidate..."
            variant="outlined"
            error={!applicationData.personalStatement.trim()}
            helperText={!applicationData.personalStatement.trim() ? "Personal statement is required" : ""}
          />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <strong>Additional Information (Optional):</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={applicationData.additionalInfo}
            onChange={(e) => setApplicationData({ ...applicationData, additionalInfo: e.target.value })}
            placeholder="Any additional information you'd like to share..."
            variant="outlined"
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> You can only apply to maximum 2 courses per institution. 
              Make sure this is your preferred choice.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitApplication} 
            variant="contained"
            disabled={!applicationData.personalStatement.trim()}
            startIcon={<CheckCircle />}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
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

export default StudentCourses;