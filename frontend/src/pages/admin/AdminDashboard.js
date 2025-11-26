import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Button,
  Tabs,
  Tab,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  People,
  School,
  Business,
  TrendingUp,
  Assignment,
  Work,
  AccountCircle,
  ExitToApp,
  Notifications,
  Dashboard,
  AdminPanelSettings,
  Report,
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Block,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import actual components
import AdminInstitutions from './AdminInstitutions';
import AdminCompanies from './AdminCompanies';
import AdminStudents from './AdminStudents';
import AdminReports from './AdminReports';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StatCard = ({ title, value, subtitle, icon, color = 'primary', onClick }) => (
  <Card onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.3s ease', '&:hover': { transform: onClick ? 'translateY(-2px)' : 'none', boxShadow: onClick ? 3 : 1 } }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// New Faculty Management Component
const FacultyManagement = ({ institutionId }) => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async () => {
    try {
      const response = await api.post(`/admin/institutions/${institutionId}/faculties`, formData);
      if (response.data.success) {
        setDialogOpen(false);
        setFormData({ name: '', description: '', dean: '', contactEmail: '' });
        fetchFaculties();
      }
    } catch (err) {
      console.error('Error adding faculty:', err);
    }
  };

  useEffect(() => {
    if (institutionId) {
      fetchFaculties();
    }
  }, [institutionId]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Faculties</Typography>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faculties.map((faculty) => (
              <TableRow key={faculty.id}>
                <TableCell>{faculty.name}</TableCell>
                <TableCell>{faculty.dean}</TableCell>
                <TableCell>{faculty.contactEmail}</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New Faculty</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Faculty Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
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
    </Box>
  );
};

// New Course Management Component
const CourseManagement = ({ institutionId, facultyId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
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
      const response = await api.get(`/admin/institutions/${institutionId}/faculties/${facultyId}/courses`);
      if (response.data.success) {
        setCourses(response.data.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      const courseData = {
        ...formData,
        duration: parseInt(formData.duration),
        tuitionFee: parseFloat(formData.tuitionFee),
        maxStudents: parseInt(formData.maxStudents),
        facultyId: facultyId
      };

      const response = await api.post(`/admin/institutions/${institutionId}/courses`, courseData);
      if (response.data.success) {
        setDialogOpen(false);
        setFormData({ name: '', code: '', description: '', duration: '', tuitionFee: '', maxStudents: '', requirements: '', deadline: '', startDate: '' });
        fetchCourses();
      }
    } catch (err) {
      console.error('Error adding course:', err);
    }
  };

  useEffect(() => {
    if (institutionId && facultyId) {
      fetchCourses();
    }
  }, [institutionId, facultyId]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Courses</Typography>
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
              <TableCell>Duration</TableCell>
              <TableCell>Tuition Fee</TableCell>
              <TableCell>Max Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell>{course.duration} years</TableCell>
                <TableCell>M{course.tuitionFee}</TableCell>
                <TableCell>{course.maxStudents}</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (years)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tuition Fee"
                type="number"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained">Add Course</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// New Admissions Management Component
const AdmissionsManagement = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState('');

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/admissions');
      if (response.data.success) {
        setAdmissions(response.data.data.admissions);
      }
    } catch (err) {
      console.error('Error fetching admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAdmissions = async (courseId, admittedStudents) => {
    try {
      const response = await api.post('/admin/admissions/publish', {
        courseId,
        admittedStudents
      });
      if (response.data.success) {
        fetchAdmissions();
      }
    } catch (err) {
      console.error('Error publishing admissions:', err);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Admissions Management</Typography>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Institution</InputLabel>
        <Select
          value={selectedInstitution}
          label="Select Institution"
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          {/* Institutions would be populated from API */}
        </Select>
      </FormControl>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Total Applications</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>Admitted</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissions.map((admission) => (
              <TableRow key={admission.courseId}>
                <TableCell>{admission.courseName}</TableCell>
                <TableCell>{admission.totalApplications}</TableCell>
                <TableCell>{admission.pendingApplications}</TableCell>
                <TableCell>{admission.admittedStudents}</TableCell>
                <TableCell>{admission.capacity}</TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => handlePublishAdmissions(admission.courseId, admission.admittedStudents)}
                  >
                    Publish
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [institutionManagementOpen, setInstitutionManagementOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/notifications');
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/admin/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'institutions':
        setTabValue(1);
        break;
      case 'companies':
        setTabValue(2);
        break;
      case 'students':
        setTabValue(3);
        break;
      case 'reports':
        setTabValue(4);
        break;
      case 'admissions':
        setTabValue(5);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="warning">
        No dashboard data available
      </Alert>
    );
  }

  const { stats, pendingApprovals, recentActivities, systemHealth } = dashboardData;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Career Platform - Admin Portal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
              <Notifications />
            </Badge>
            <Typography variant="body2">
              Admin: {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: 3 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            System Overview and Management Portal
          </Typography>
          
          {pendingApprovals && (pendingApprovals.institutions?.length > 0 || pendingApprovals.companies?.length > 0) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {pendingApprovals.institutions?.length || 0} institutions and {pendingApprovals.companies?.length || 0} companies pending approval.
              <Button 
                color="inherit" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => handleQuickAction('institutions')}
              >
                Review Now
              </Button>
            </Alert>
          )}
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              subtitle={`${stats.totalStudents} students`}
              icon={<People />}
              color="primary"
              onClick={() => handleQuickAction('students')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Institutions"
              value={stats.totalInstitutions}
              subtitle={`${pendingApprovals?.institutions?.length || 0} pending`}
              icon={<School />}
              color="secondary"
              onClick={() => handleQuickAction('institutions')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Companies"
              value={stats.totalCompanies}
              subtitle={`${pendingApprovals?.companies?.length || 0} pending`}
              icon={<Business />}
              color="success"
              onClick={() => handleQuickAction('companies')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Applications"
              value={stats.totalApplications}
              subtitle="Across system"
              icon={<Assignment />}
              color="warning"
              onClick={() => handleQuickAction('reports')}
            />
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<Dashboard />} label="Overview" />
            <Tab icon={<School />} label="Institutions" />
            <Tab icon={<Business />} label="Companies" />
            <Tab icon={<People />} label="Students" />
            <Tab icon={<Report />} label="Reports" />
            <Tab icon={<Assignment />} label="Admissions" />
            <Tab 
              icon={
                <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
                  <Notifications />
                </Badge>
              } 
              label="Notifications" 
            />
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Pending Approvals */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pending Approvals
                    </Typography>
                    {pendingApprovals && (pendingApprovals.institutions?.length > 0 || pendingApprovals.companies?.length > 0) ? (
                      <List>
                        {pendingApprovals.institutions?.slice(0, 3).map((institution) => (
                          <React.Fragment key={institution.id}>
                            <ListItem>
                              <ListItemIcon>
                                <School color="warning" />
                              </ListItemIcon>
                              <ListItemText
                                primary={institution.name}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {institution.email}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Registered: {new Date(institution.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label="Pending"
                                color="warning"
                                size="small"
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                        {pendingApprovals.companies?.slice(0, 3).map((company) => (
                          <React.Fragment key={company.id}>
                            <ListItem>
                              <ListItemIcon>
                                <Business color="warning" />
                              </ListItemIcon>
                              <ListItemText
                                primary={company.name}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {company.email}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Industry: {company.industry}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label="Pending"
                                color="warning"
                                size="small"
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No pending approvals
                      </Typography>
                    )}
                    {(pendingApprovals?.institutions?.length > 3 || pendingApprovals?.companies?.length > 3) && (
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => handleQuickAction('institutions')}
                      >
                        View All Pending Approvals
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activities */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activities
                    </Typography>
                    {recentActivities && recentActivities.length > 0 ? (
                      <List>
                        {recentActivities.slice(0, 5).map((activity, index) => (
                          <React.Fragment key={activity.id}>
                            <ListItem>
                              <ListItemIcon>
                                <TrendingUp />
                              </ListItemIcon>
                              <ListItemText
                                primary={activity.description}
                                secondary={
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </Typography>
                                }
                              />
                              <Chip
                                label={activity.type}
                                color={activity.type === 'registration' ? 'primary' : 'success'}
                                size="small"
                              />
                            </ListItem>
                            {index < recentActivities.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No recent activities
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* System Health */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Health
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                          <TrendingUp sx={{ fontSize: 48, color: systemHealth?.status === 'healthy' ? 'success.main' : 'warning.main', mb: 1 }} />
                          <Typography variant="h6">
                            {systemHealth?.status === 'healthy' ? 'Operational' : 'Issues Detected'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            System Status
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                          <Work sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6">{stats.activeJobs}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Active Jobs
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                          <School sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                          <Typography variant="h6">{stats.courses}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Courses
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            cursor: 'pointer', 
                            '&:hover': { 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              '& .MuiSvgIcon-root': { color: 'white' }
                            },
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleQuickAction('institutions')}
                        >
                          <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6">Manage Institutions</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Add and approve institutions
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            cursor: 'pointer', 
                            '&:hover': { 
                              bgcolor: 'secondary.light', 
                              color: 'white',
                              '& .MuiSvgIcon-root': { color: 'white' }
                            },
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleQuickAction('companies')}
                        >
                          <Business sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                          <Typography variant="h6">Manage Companies</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Approve and monitor companies
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            textAlign: 'center', 
                            cursor: 'pointer', 
                            '&:hover': { 
                              bgcolor: 'success.light', 
                              color: 'white',
                              '& .MuiSvgIcon-root': { color: 'white' }
                            },
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleQuickAction('reports')}
                        >
                          <Report sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography variant="h6">View Reports</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            System analytics and insights
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Other tabs - Using actual components */}
          <TabPanel value={tabValue} index={1}>
            <AdminInstitutions />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <AdminCompanies />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <AdminStudents />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <AdminReports />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <AdmissionsManagement />
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            <NotificationsTab 
              notifications={notifications} 
              onMarkAsRead={markNotificationAsRead}
            />
          </TabPanel>
        </Paper>
      </Box>
    </Box>
  );
};

// Notifications Tab Component
const NotificationsTab = ({ notifications, onMarkAsRead }) => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Notifications
    </Typography>
    <Typography variant="body1" color="textSecondary" gutterBottom>
      System notifications and alerts
    </Typography>
    
    {notifications.length > 0 ? (
      <List>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem 
              sx={{ 
                backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                borderLeft: notification.isRead ? 'none' : '4px solid',
                borderLeftColor: 'primary.main',
                cursor: 'pointer'
              }}
              onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
            >
              <ListItemIcon>
                <Notifications color={notification.isRead ? "disabled" : "primary"} />
              </ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              {!notification.isRead && (
                <Chip label="New" color="primary" size="small" />
              )}
            </ListItem>
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    ) : (
      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
        No notifications at the moment
      </Typography>
    )}
  </Box>
);

export default AdminDashboard;