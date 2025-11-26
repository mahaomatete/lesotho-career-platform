import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Container,
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
  Divider
} from '@mui/material';
import {
  School,
  Work,
  Description,
  Notifications,
  Dashboard,
  Assignment,
  AccountCircle,
  ExitToApp,
  CheckCircle,
  Pending,
  Cancel,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import actual components instead of placeholders
import StudentCourses from './StudentCourses';
import StudentApplications from './StudentApplications';
import StudentJobs from './StudentJobs';
import StudentDocuments from './StudentDocuments';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchStudentDashboard();
    fetchNotifications();
  }, []);

  const fetchStudentDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
     // console.error('Error fetching dashboard:', err);
      //setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/student/notifications');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'admitted': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'waiting_list': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'admitted': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'rejected': return <Cancel />;
      default: return <Pending />;
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/student/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
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

  const { studentInfo, stats, recentApplications, recommendedJobs } = dashboardData;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Career Guidance Platform - Student Portal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
              <Notifications />
            </Badge>
            <Typography variant="body2">
              Welcome, {studentInfo?.firstName || user?.firstName}
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/student/profile'); }}>
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

      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {studentInfo?.firstName || user?.firstName}!
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Student Career Portal - Manage your education and career journey
          </Typography>
          
          {studentInfo?.profileComplete !== '100%' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Complete your profile to get better job recommendations.
              <Button 
                color="inherit" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => navigate('/student/profile')}
              >
                Complete Profile
              </Button>
            </Alert>
          )}
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      My Applications
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.totalApplications || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stats?.pendingApplications || 0} pending
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'primary.light', borderRadius: '50%', p: 1, color: 'white' }}>
                    <Assignment />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Admitted
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.admittedApplications || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stats?.successRate || 0}% success rate
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'success.light', borderRadius: '50%', p: 1, color: 'white' }}>
                    <School />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Job Applications
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats?.jobApplications || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stats?.pendingJobApplications || 0} pending
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'warning.light', borderRadius: '50%', p: 1, color: 'white' }}>
                    <Work />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Documents
                    </Typography>
                    <Typography variant="h4" component="div">
                      {(stats?.transcriptsUploaded || 0) + (stats?.certificatesUploaded || 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Uploaded files
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'info.light', borderRadius: '50%', p: 1, color: 'white' }}>
                    <Description />
                  </Box>
                </Box>
              </CardContent>
            </Card>
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
            <Tab icon={<School />} label="Browse Courses" />
            <Tab icon={<Assignment />} label="My Applications" />
            <Tab icon={<Work />} label="Job Opportunities" />
            <Tab icon={<Description />} label="My Documents" />
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
              {/* Recent Applications */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Applications
                    </Typography>
                    {recentApplications && recentApplications.length > 0 ? (
                      <List>
                        {recentApplications.slice(0, 5).map((application, index) => (
                          <React.Fragment key={application.id}>
                            <ListItem>
                              <ListItemIcon>
                                {getStatusIcon(application.status)}
                              </ListItemIcon>
                              <ListItemText
                                primary={application.courseName}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {application.instituteName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Applied: {new Date(application.appliedAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label={application.status}
                                color={getStatusColor(application.status)}
                                size="small"
                              />
                            </ListItem>
                            {index < recentApplications.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No applications yet
                      </Typography>
                    )}
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => setTabValue(2)}
                    >
                      View All Applications
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recommended Jobs */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommended Jobs
                    </Typography>
                    {recommendedJobs && recommendedJobs.length > 0 ? (
                      <List>
                        {recommendedJobs.slice(0, 3).map((job, index) => (
                          <React.Fragment key={job.id}>
                            <ListItem>
                              <ListItemIcon>
                                <Business />
                              </ListItemIcon>
                              <ListItemText
                                primary={job.title}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {job.companyName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Match: {job.qualificationScore}% • {job.location}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label={`${job.qualificationScore}% Match`}
                                color={job.qualificationScore >= 80 ? 'success' : 'warning'}
                                size="small"
                              />
                            </ListItem>
                            {index < recommendedJobs.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No recommended jobs at the moment
                      </Typography>
                    )}
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => setTabValue(3)}
                    >
                      Browse More Jobs
                    </Button>
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
                          onClick={() => setTabValue(1)}
                        >
                          <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6">Browse Courses</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Explore available courses and apply
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
                          onClick={() => setTabValue(3)}
                        >
                          <Work sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                          <Typography variant="h6">Find Jobs</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Browse job opportunities
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
                              bgcolor: 'info.light', 
                              color: 'white',
                              '& .MuiSvgIcon-root': { color: 'white' }
                            },
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => setTabValue(4)}
                        >
                          <Description sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                          <Typography variant="h6">Upload Documents</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Manage transcripts & certificates
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
            <StudentCourses />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <StudentApplications />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <StudentJobs />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <StudentDocuments />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <NotificationsTab 
              notifications={notifications} 
              onMarkAsRead={markNotificationAsRead}
            />
          </TabPanel>
        </Paper>
      </Container>
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
      Receive updates about your applications and matching job opportunities
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

export default StudentDashboard;