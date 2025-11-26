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
  LinearProgress,
  Snackbar,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  MoreVert,
  CheckCircle,
  Block,
  School,
  Edit,
  Delete,
  Visibility,
  CorporateFare,
  Class
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`institution-tabpanel-${index}`}
      aria-labelledby={`institution-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Faculty Management Component
const FacultyManagement = ({ institutionId }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dean: '',
    contactEmail: ''
  });

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/institutions/${institutionId}/faculties`);
      if (response.data.success) {
        setFaculties(response.data.data.faculties);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching faculties',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async () => {
    try {
      const response = await api.post(`/admin/institutions/${institutionId}/faculties`, formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty added successfully',
          severity: 'success'
        });
        setDialogOpen(false);
        setFormData({ name: '', description: '', dean: '', contactEmail: '' });
        fetchFaculties();
      }
    } catch (err) {
      console.error('Error adding faculty:', err);
      setSnackbar({
        open: true,
        message: 'Error adding faculty',
        severity: 'error'
      });
    }
  };

  const handleEditFaculty = async () => {
    try {
      const response = await api.put(`/admin/institutions/${institutionId}/faculties/${selectedFaculty.id}`, formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        setFormData({ name: '', description: '', dean: '', contactEmail: '' });
        setSelectedFaculty(null);
        fetchFaculties();
      }
    } catch (err) {
      console.error('Error updating faculty:', err);
      setSnackbar({
        open: true,
        message: 'Error updating faculty',
        severity: 'error'
      });
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    try {
      const response = await api.delete(`/admin/institutions/${institutionId}/faculties/${facultyId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Faculty deleted successfully',
          severity: 'success'
        });
        fetchFaculties();
      }
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting faculty',
        severity: 'error'
      });
    }
  };

  const openEditDialog = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      name: faculty.name,
      description: faculty.description,
      dean: faculty.dean,
      contactEmail: faculty.contactEmail
    });
    setEditDialogOpen(true);
  };

  useEffect(() => {
    if (institutionId) {
      fetchFaculties();
    }
  }, [institutionId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Faculties Management</Typography>
        <Button startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Add Faculty
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Dean</TableCell>
              <TableCell>Contact Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faculties.map((faculty) => (
              <TableRow key={faculty.id}>
                <TableCell>
                  <Typography variant="subtitle1">{faculty.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {faculty.description}
                  </Typography>
                </TableCell>
                <TableCell>{faculty.dean}</TableCell>
                <TableCell>{faculty.contactEmail}</TableCell>
                <TableCell>
                  <Chip 
                    label={faculty.isActive ? 'Active' : 'Inactive'} 
                    color={faculty.isActive ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEditDialog(faculty)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteFaculty(faculty.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Faculty Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Faculty</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Faculty Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Dean"
            value={formData.dean}
            onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFaculty} variant="contained">Add Faculty</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Faculty</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Faculty Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Dean"
            value={formData.dean}
            onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contact Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditFaculty} variant="contained">Update Faculty</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

// Course Management Component
const CourseManagement = ({ institutionId }) => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
    description: '',
    duration: '',
    tuitionFee: '',
    maxStudents: '',
    requirements: '',
    deadline: '',
    startDate: ''
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/institutions/${institutionId}/courses`);
      if (response.data.success) {
        setCourses(response.data.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching courses',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get(`/admin/institutions/${institutionId}/faculties`);
      if (response.data.success) {
        setFaculties(response.data.data.faculties);
      }
    } catch (err) {
      console.error('Error fetching faculties:', err);
    }
  };

  const handleAddCourse = async () => {
    try {
      const courseData = {
        ...formData,
        duration: parseInt(formData.duration),
        tuitionFee: parseFloat(formData.tuitionFee),
        maxStudents: parseInt(formData.maxStudents)
      };

      const response = await api.post(`/admin/institutions/${institutionId}/courses`, courseData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course added successfully',
          severity: 'success'
        });
        setDialogOpen(false);
        setFormData({ name: '', code: '', facultyId: '', description: '', duration: '', tuitionFee: '', maxStudents: '', requirements: '', deadline: '', startDate: '' });
        fetchCourses();
      }
    } catch (err) {
      console.error('Error adding course:', err);
      setSnackbar({
        open: true,
        message: 'Error adding course',
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
        maxStudents: parseInt(formData.maxStudents)
      };

      const response = await api.put(`/admin/institutions/${institutionId}/courses/${selectedCourse.id}`, courseData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        setFormData({ name: '', code: '', facultyId: '', description: '', duration: '', tuitionFee: '', maxStudents: '', requirements: '', deadline: '', startDate: '' });
        setSelectedCourse(null);
        fetchCourses();
      }
    } catch (err) {
      console.error('Error updating course:', err);
      setSnackbar({
        open: true,
        message: 'Error updating course',
        severity: 'error'
      });
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const response = await api.delete(`/admin/institutions/${institutionId}/courses/${courseId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Course deleted successfully',
          severity: 'success'
        });
        fetchCourses();
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting course',
        severity: 'error'
      });
    }
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
      requirements: course.requirements?.join(', ') || '',
      deadline: course.deadline ? new Date(course.deadline).toISOString().split('T')[0] : '',
      startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : ''
    });
    setEditDialogOpen(true);
  };

  useEffect(() => {
    if (institutionId) {
      fetchCourses();
      fetchFaculties();
    }
  }, [institutionId]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Courses Management</Typography>
        <Button startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Add Course
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Tuition Fee</TableCell>
              <TableCell>Max Students</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>
                  <Typography variant="subtitle1">{course.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {course.description?.substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  {faculties.find(f => f.id === course.facultyId)?.name || 'N/A'}
                </TableCell>
                <TableCell>{course.duration} years</TableCell>
                <TableCell>M{course.tuitionFee}</TableCell>
                <TableCell>{course.maxStudents}</TableCell>
                <TableCell>
                  <Chip 
                    label={course.status === 'active' ? 'Active' : 'Inactive'} 
                    color={course.status === 'active' ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEditDialog(course)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteCourse(course.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Course Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={formData.facultyId}
                  label="Faculty"
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
                label="Description"
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
                label="Duration (years)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tuition Fee"
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Application Deadline"
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
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={2}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="List course requirements separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained">Add Course</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={formData.facultyId}
                  label="Faculty"
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
                label="Description"
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
                label="Duration (years)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tuition Fee"
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Application Deadline"
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
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={2}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCourse} variant="contained">Update Course</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

const AdminInstitutions = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [managementInstitution, setManagementInstitution] = useState(null);

  const [formData, setFormData] = useState({
    institutionName: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    type: 'university',
    establishedYear: '',
    accreditation: ''
  });

  useEffect(() => {
    fetchInstitutions();
  }, [page]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/institutions?page=${page}&limit=10`);
      if (response.data.success) {
        setInstitutions(response.data.data.institutions);
        setTotalPages(response.data.data.totalPages || 1);
      } else {
        setError('Failed to load institutions');
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setError('Error loading institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, institution) => {
    setAnchorEl(event.currentTarget);
    setSelectedInstitution(institution);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInstitution(null);
  };

  // FIXED: Suspend/Activate functionality
  const handleSuspend = async (institutionId, isActive) => {
    try {
      const action = isActive ? 'suspend' : 'activate';
      const response = await api.patch(`/admin/institutions/${institutionId}/status`, {
        action: action
      });
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `Institution ${action === 'suspend' ? 'suspended' : 'activated'} successfully`,
          severity: 'success'
        });
        fetchInstitutions();
      }
    } catch (err) {
      console.error('Error updating institution status:', err);
      setSnackbar({
        open: true,
        message: 'Error updating institution status',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  // FIXED: Delete functionality
  const handleDelete = async (institutionId) => {
    try {
      const response = await api.delete(`/admin/institutions/${institutionId}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Institution deleted successfully',
          severity: 'success'
        });
        fetchInstitutions();
      }
    } catch (err) {
      console.error('Error deleting institution:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting institution',
        severity: 'error'
      });
    }
    handleMenuClose();
  };

  // FIXED: Add institution functionality
  const handleAddInstitution = async () => {
    try {
      const institutionData = {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null
      };

      const response = await api.post('/admin/institutions', institutionData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Institution added successfully',
          severity: 'success'
        });
        setDialogOpen(false);
        resetForm();
        fetchInstitutions();
      }
    } catch (err) {
      console.error('Error adding institution:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error adding institution',
        severity: 'error'
      });
    }
  };

  // FIXED: Edit institution functionality
  const handleEditInstitution = async () => {
    try {
      const institutionData = {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null
      };

      // Remove password if empty (don't update password)
      if (!institutionData.password) {
        delete institutionData.password;
      }

      const response = await api.put(`/admin/institutions/${selectedInstitution.id}`, institutionData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Institution updated successfully',
          severity: 'success'
        });
        setEditDialogOpen(false);
        resetForm();
        fetchInstitutions();
      }
    } catch (err) {
      console.error('Error updating institution:', err);
      setSnackbar({
        open: true,
        message: 'Error updating institution',
        severity: 'error'
      });
    }
  };

  const openEditDialog = (institution) => {
    setSelectedInstitution(institution);
    setFormData({
      institutionName: institution.institutionName,
      email: institution.email,
      password: '', // Don't pre-fill password for security
      address: institution.address || '',
      phone: institution.phone || '',
      website: institution.website || '',
      description: institution.description || '',
      type: institution.type || 'university',
      establishedYear: institution.establishedYear || '',
      accreditation: institution.accreditation || ''
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      institutionName: '',
      email: '',
      password: '',
      address: '',
      phone: '',
      website: '',
      description: '',
      type: 'university',
      establishedYear: '',
      accreditation: ''
    });
  };

  const getStatusChip = (institution) => {
    if (!institution.isApproved) {
      return <Chip label="Pending Approval" color="warning" size="small" />;
    }
    if (!institution.isActive) {
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

  const handleManageInstitution = (institution) => {
    setManagementInstitution(institution);
    setTabValue(1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      {managementInstitution ? (
        <Box>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => setManagementInstitution(null)} sx={{ mr: 2 }}>
              <School />
            </IconButton>
            <Box>
              <Typography variant="h4">
                {managementInstitution.institutionName}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage Institution Details
              </Typography>
            </Box>
          </Box>

          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab icon={<CorporateFare />} label="Institution Details" />
              <Tab icon={<School />} label="Faculties" />
              <Tab icon={<Class />} label="Courses" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Card>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">Basic Information</Typography>
                      <Typography><strong>Name:</strong> {managementInstitution.institutionName}</Typography>
                      <Typography><strong>Email:</strong> {managementInstitution.email}</Typography>
                      <Typography><strong>Type:</strong> {managementInstitution.type}</Typography>
                      <Typography><strong>Phone:</strong> {managementInstitution.phone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">Additional Information</Typography>
                      <Typography><strong>Address:</strong> {managementInstitution.address || 'N/A'}</Typography>
                      <Typography><strong>Website:</strong> {managementInstitution.website || 'N/A'}</Typography>
                      <Typography><strong>Established:</strong> {managementInstitution.establishedYear || 'N/A'}</Typography>
                      <Typography><strong>Accreditation:</strong> {managementInstitution.accreditation || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6">Description</Typography>
                      <Typography>{managementInstitution.description || 'No description available'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6">Statistics</Typography>
                      <Grid container spacing={2}>
                        <Grid item>
                          <Chip 
                            label={`${managementInstitution.stats?.totalCourses || 0} Courses`} 
                            variant="outlined" 
                          />
                        </Grid>
                        <Grid item>
                          <Chip 
                            label={`${managementInstitution.stats?.totalApplications || 0} Applications`} 
                            variant="outlined" 
                          />
                        </Grid>
                        <Grid item>
                          <Chip 
                            label={`${managementInstitution.stats?.activeCourses || 0} Active Courses`} 
                            variant="outlined" 
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <FacultyManagement institutionId={managementInstitution.id} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <CourseManagement institutionId={managementInstitution.id} />
            </TabPanel>
          </Paper>
        </Box>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" gutterBottom>
              Manage Institutions
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
            >
              Add Institution
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Institution Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Courses</TableCell>
                      <TableCell>Applications</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {institutions.map((institution) => (
                      <TableRow key={institution.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <School sx={{ mr: 2, color: 'primary.main' }} />
                            <Box>
                              <Typography variant="subtitle1">
                                {institution.institutionName}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {institution.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{institution.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={institution.type} 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={institution.stats?.totalCourses || 0} 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={institution.stats?.totalApplications || 0} 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {getStatusChip(institution)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleManageInstitution(institution)}
                            title="Manage Institution"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, institution)}
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

          {/* Add Institution Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Add New Institution</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Institution Name *"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Institution Type *</InputLabel>
                    <Select
                      value={formData.type}
                      label="Institution Type *"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <MenuItem value="university">University</MenuItem>
                      <MenuItem value="college">College</MenuItem>
                      <MenuItem value="technical">Technical Institute</MenuItem>
                      <MenuItem value="vocational">Vocational School</MenuItem>
                      <MenuItem value="polytechnic">Polytechnic</MenuItem>
                    </Select>
                  </FormControl>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Established Year"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Accreditation"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
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
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddInstitution} variant="contained">
                Add Institution
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Institution Dialog */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Edit Institution</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Institution Name *"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Institution Type *</InputLabel>
                    <Select
                      value={formData.type}
                      label="Institution Type *"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <MenuItem value="university">University</MenuItem>
                      <MenuItem value="college">College</MenuItem>
                      <MenuItem value="technical">Technical Institute</MenuItem>
                      <MenuItem value="vocational">Vocational School</MenuItem>
                      <MenuItem value="polytechnic">Polytechnic</MenuItem>
                    </Select>
                  </FormControl>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Established Year"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Accreditation"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
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
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditInstitution} variant="contained">
                Update Institution
              </Button>
            </DialogActions>
          </Dialog>

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {!selectedInstitution?.isApproved && (
              <MenuItem onClick={() => {
                // Approve functionality
                api.post(`/admin/approve/${selectedInstitution?.id}`, { type: 'institute' })
                  .then(response => {
                    if (response.data.success) {
                      setSnackbar({
                        open: true,
                        message: 'Institution approved successfully',
                        severity: 'success'
                      });
                      fetchInstitutions();
                    }
                  })
                  .catch(err => {
                    setSnackbar({
                      open: true,
                      message: 'Error approving institution',
                      severity: 'error'
                    });
                  });
                handleMenuClose();
              }}>
                <CheckCircle sx={{ mr: 1 }} />
                Approve
              </MenuItem>
            )}
            <MenuItem onClick={() => handleSuspend(selectedInstitution?.id, selectedInstitution?.isActive)}>
              <Block sx={{ mr: 1 }} />
              {selectedInstitution?.isActive ? 'Suspend' : 'Activate'}
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); openEditDialog(selectedInstitution); }}>
              <Edit sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => handleDelete(selectedInstitution?.id)}>
              <Delete sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </>
      )}

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

export default AdminInstitutions;