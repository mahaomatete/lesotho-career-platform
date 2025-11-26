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
  TextField,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Person,
  School,
  Email,
  Phone,
  Download,
  Visibility,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InstituteStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    courseId: 'all'
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [page, filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.courseId !== 'all') queryParams.append('courseId', filters.courseId);
      queryParams.append('page', page);
      queryParams.append('limit', '10');

      const response = await api.get(`/institute/students?${queryParams}`);
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

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setDetailDialogOpen(true);
  };

  const downloadStudentDocuments = async (studentId, type) => {
    try {
      const response = await api.get(`/institute/students/${studentId}/documents/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error downloading document',
        severity: 'error'
      });
    }
  };

  const generateAdmissionLetter = async (studentId, applicationId) => {
    try {
      const response = await api.get(`/institute/students/${studentId}/admission-letter/${applicationId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admission-letter-${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error generating admission letter',
        severity: 'error'
      });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' },
      waiting_list: { color: 'info', label: 'Waiting List' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const filteredStudents = students.filter(student =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        Student Management
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        View and manage admitted students and their applications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Students"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or student ID..."
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Filter by Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="admitted">Admitted</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="waiting_list">Waiting List</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ status: 'all', courseId: 'all' });
                }}
                fullWidth
              >
                Clear
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
                  <TableCell>Contact</TableCell>
                  <TableCell>Admitted Course</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Current Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.studentId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {student.studentName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {student.studentId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {student.email}
                          </Typography>
                        </Box>
                        {student.phone && (
                          <Box display="flex" alignItems="center">
                            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {student.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {student.admittedCourse ? (
                        <Box>
                          <Typography variant="body2">
                            {student.admittedCourse.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {student.admittedCourse.faculty}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not admitted yet
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {student.applications.map((app, index) => (
                          <Chip
                            key={index}
                            label={`${app.courseName} - ${app.status}`}
                            color={
                              app.status === 'admitted' ? 'success' :
                              app.status === 'rejected' ? 'error' : 'warning'
                            }
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Transcripts: {student.documents?.transcripts || 0}
                        </Typography>
                        <Typography variant="body2">
                          Certificates: {student.documents?.certificates || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(student.currentStatus)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetails(student)}
                        >
                          View
                        </Button>
                        {student.admittedCourse && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => generateAdmissionLetter(student.studentId, student.admittedApplicationId)}
                          >
                            Letter
                          </Button>
                        )}
                      </Box>
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

          {filteredStudents.length === 0 && (
            <Box textAlign="center" py={4}>
              <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No students found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || filters.status !== 'all' || filters.courseId !== 'all' 
                  ? 'Try adjusting your search terms or filters' 
                  : 'No students have been admitted yet'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Student Statistics */}
      {students.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {students.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {students.filter(s => s.currentStatus === 'admitted').length}
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
                <Typography variant="h4" color="warning.main">
                  {students.filter(s => s.currentStatus === 'pending').length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {students.reduce((sum, student) => sum + (student.documents?.transcripts || 0), 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Student Details - {selectedStudent?.studentName}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Full Name:</strong> {selectedStudent.studentName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Student ID:</strong> {selectedStudent.studentId}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedStudent.email}</Typography>
                  </Grid>
                  {selectedStudent.phone && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedStudent.phone}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Application History</Typography>
                {selectedStudent.applications.map((app, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2">{app.courseName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {app.facultyName} • Applied: {new Date(app.appliedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={app.status} 
                          color={
                            app.status === 'admitted' ? 'success' :
                            app.status === 'rejected' ? 'error' : 'warning'
                          }
                          size="small"
                        />
                      </Box>
                      {app.personalStatement && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Personal Statement:</strong> {app.personalStatement}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Documents</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadStudentDocuments(selectedStudent.studentId, 'transcripts')}
                  >
                    Download Transcripts ({selectedStudent.documents?.transcripts || 0})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadStudentDocuments(selectedStudent.studentId, 'certificates')}
                  >
                    Download Certificates ({selectedStudent.documents?.certificates || 0})
                  </Button>
                  {selectedStudent.admittedCourse && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => generateAdmissionLetter(selectedStudent.studentId, selectedStudent.admittedApplicationId)}
                    >
                      Generate Admission Letter
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default InstituteStudents;