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
  School,
  Visibility,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InstituteCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    description: '',
    duration: '',
    tuitionFee: '',
    maxStudents: '',
    requirements: [''],
    qualifications: [''],
    deadline: '',
    startDate: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCourses();
    fetchFaculties();
  }, [page]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/institute/courses?page=${page}&limit=10`);
      if (response.data.success) {
        setCourses(response.data.data.courses);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/institute/faculties');
      if (response.data.success) {
        setFaculties(response.data.data.faculties);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const handleMenuOpen = (event, course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleAddCourse = async () => {
    try {
      const courseData = {
        ...formData,
        duration: parseInt(formData.duration),
        tuitionFee: parseFloat(formData.tuitionFee),
        maxStudents: parseInt(formData.maxStudents),
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        qualifications: formData.qualifications.filter(qual => qual.trim() !== ''),
        deadline: new Date(formData.deadline).toISOString(),
        startDate: new Date(formData.startDate).toISOString()
      };

      const response = await api.post('/institute/courses', courseData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course created successfully!',
          severity: 'success'
        });
        setDialogOpen(false);
        resetForm();
        fetchCourses();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating course',
        severity: 'error'
      });
    }
  };

  const handleEditCourse = async () => {
    try {
      const courseData = {
        ...formData,
        duration: parseInt(formData.duration),
        tuitionFee: parseFloat(formData.tuitionFee),
        maxStudents: parseInt(formData.maxStudents),
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        qualifications: formData.qualifications.filter(qual => qual.trim() !== ''),
        deadline: new Date(formData.deadline).toISOString(),
        startDate: new Date(formData.startDate).toISOString()
      };

      const response = await api.put(`/institute/courses/${selectedCourse.id}`, courseData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course updated successfully!',
          severity: 'success'
        });
        setEditDialogOpen(false);
        resetForm();
        fetchCourses();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating course',
        severity: 'error'
      });
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const response = await api.delete(`/institute/courses/${courseId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course deleted successfully',
          severity: 'success'
        });
        fetchCourses();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error deleting course',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await api.patch(`/institute/courses/${courseId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Course ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
        fetchCourses();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating course status',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  const handleViewApplications = (courseId) => {
    // Navigate to applications page filtered by this course
    window.location.href = `/institute/applications?courseId=${courseId}`;
    handleMenuClose();
  };

  const openEditDialog = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      facultyId: course.facultyId,
      description: course.description,
      duration: course.duration.toString(),
      tuitionFee: course.tuitionFee.toString(),
      maxStudents: course.maxStudents.toString(),
      requirements: course.requirements.length > 0 ? course.requirements : [''],
      qualifications: course.qualifications?.length > 0 ? course.qualifications : [''],
      deadline: course.deadline ? course.deadline.split('T')[0] : '',
      startDate: course.startDate ? course.startDate.split('T')[0] : '',
      status: course.status
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      facultyId: '',
      description: '',
      duration: '',
      tuitionFee: '',
      maxStudents: '',
      requirements: [''],
      qualifications: [''],
      deadline: '',
      startDate: '',
      status: 'active'
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

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, '']
    });
  };

  const updateQualification = (index, value) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = value;
    setFormData({ ...formData, qualifications: newQualifications });
  };

  const removeQualification = (index) => {
    const newQualifications = formData.qualifications.filter((_, i) => i !== index);
    setFormData({ ...formData, qualifications: newQualifications });
  };

  const getStatusChip = (course) => {
    if (course.status === 'active') {
      return <Chip label="Active" color="success" size="small" />;
    }
    return <Chip label="Inactive" color="default" size="small" />;
  };

  const getCapacityColor = (course) => {
    if (course.maxStudents === 0) return 'default';
    const percentage = (course.currentStudents / course.maxStudents) * 100;
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
          Manage Courses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Course
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Tuition Fee</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <School sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {course.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {course.description?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={course.code} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>{course.facultyName}</TableCell>
                    <TableCell>{course.duration} years</TableCell>
                    <TableCell>M{course.tuitionFee?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${course.currentStudents}/${course.maxStudents}`}
                        color={getCapacityColor(course)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Total: {course.stats?.totalApplications || 0}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Admitted: {course.stats?.admittedApplications || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(course)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(course.deadline).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, course)}
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

      {/* Add Course Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Faculty *</InputLabel>
                <Select
                  value={formData.facultyId}
                  label="Faculty *"
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  required
                >
                  {faculties.map((faculty) => (
                    <MenuItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (years) *"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tuition Fee (M) *"
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Students *"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
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
              <TextField
                fullWidth
                label="Start Date *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
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
                    placeholder="Enter requirement (e.g., High School Diploma)"
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

            {/* Qualifications */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Qualifications (Optional)
              </Typography>
              {formData.qualifications.map((qualification, index) => (
                <Box key={index} display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={qualification}
                    onChange={(e) => updateQualification(index, e.target.value)}
                    placeholder="Enter qualification (e.g., Mathematics Background)"
                  />
                  <Button
                    color="error"
                    onClick={() => removeQualification(index)}
                    disabled={formData.qualifications.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button onClick={addQualification} variant="outlined">
                Add Qualification
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained" startIcon={<CheckCircle />}>
            Create Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          {/* Same form structure as Add Course Dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            {/* ... rest of the form fields same as Add Course Dialog ... */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCourse} variant="contained" startIcon={<CheckCircle />}>
            Update Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewApplications(selectedCourse?.id)}>
          <Visibility sx={{ mr: 1 }} />
          View Applications
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); openEditDialog(selectedCourse); }}>
          <Edit sx={{ mr: 1 }} />
          Edit Course
        </MenuItem>
        <MenuItem onClick={() => handleToggleCourseStatus(selectedCourse?.id, selectedCourse?.status)}>
          {selectedCourse?.status === 'active' ? (
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
        <MenuItem onClick={() => handleDeleteCourse(selectedCourse?.id)}>
          <Delete sx={{ mr: 1 }} />
          Delete Course
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

export default InstituteCourses;