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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  School,
  Business,
  People,
  Notifications,
  Dashboard,
  Assignment,
  AccountCircle,
  ExitToApp,
  TrendingUp,
  Add,
  Pending,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import actual components
import InstituteCourses from './InstituteCourses';
import InstituteApplications from './InstituteApplications';
import InstituteStudents from './InstituteStudents';
import InstituteFaculties from './InstituteFaculties';
import InstituteProfile from './InstituteProfile';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`institute-tabpanel-${index}`}
      aria-labelledby={`institute-tab-${index}`}
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

const InstituteDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchInstituteDashboard();
    fetchNotifications();
  }, []);

  const fetchInstituteDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/institute/dashboard');
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
      const response = await api.get('/institute/notifications');
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
      await api.put(`/institute/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
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

  const { instituteInfo, stats, recentApplications, coursesNearingCapacity, courseAdmissionStats, pendingActions } = dashboardData;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Career Platform - Institute Portal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
              <Notifications />
            </Badge>
            <Typography variant="body2">
              {instituteInfo.name}
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); setTabValue(5); }}>
                <AccountCircle sx={{ mr: 1 }} />
                Institute Profile
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
            Welcome, {instituteInfo.name}!
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Institute Management Portal - Manage courses, applications, and admissions
          </Typography>
          
          {!instituteInfo.isApproved && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your institute account is pending approval. Some features may be limited until approved by admin.
            </Alert>
          )}

          {instituteInfo.profileComplete !== '100%' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your institute profile is {instituteInfo.profileComplete} complete. 
              <Button 
                color="inherit" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => setTabValue(5)}
              >
                Complete Profile
              </Button>
            </Alert>
          )}

          {pendingActions && pendingActions.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You have {pendingActions.length} pending actions requiring attention.
              <Button 
                color="inherit" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => setTabValue(2)}
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
              title="Total Courses"
              value={stats.totalCourses}
              subtitle={`${stats.activeCourses} active`}
              icon={<School />}
              color="primary"
              onClick={() => setTabValue(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Applications"
              value={stats.totalApplications}
              subtitle={`${stats.pendingApplications} pending`}
              icon={<Assignment />}
              color="warning"
              onClick={() => setTabValue(2)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Admitted Students"
              value={stats.admittedApplications}
              subtitle={`${stats.admissionRate}% admission rate`}
              icon={<People />}
              color="success"
              onClick={() => setTabValue(3)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Faculties"
              value={stats.totalFaculties}
              subtitle="Academic departments"
              icon={<Business />}
              color="info"
              onClick={() => setTabValue(4)}
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
            <Tab icon={<School />} label="Courses" />
            <Tab icon={<Assignment />} label="Applications" />
            <Tab icon={<People />} label="Students" />
            <Tab icon={<Business />} label="Faculties" />
            <Tab icon={<AccountCircle />} label="Institute Profile" />
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
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Recent Applications
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setTabValue(2)}
                      >
                        View All
                      </Button>
                    </Box>
                    {recentApplications && recentApplications.length > 0 ? (
                      <List>
                        {recentApplications.slice(0, 5).map((application, index) => (
                          <React.Fragment key={application.id}>
                            <ListItem>
                              <ListItemIcon>
                                {getStatusIcon(application.status)}
                              </ListItemIcon>
                              <ListItemText
                                primary={application.studentName}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {application.courseName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {new Date(application.appliedAt).toLocaleDateString()}
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
                        No recent applications
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Courses Nearing Capacity */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Courses Nearing Capacity
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setTabValue(1)}
                      >
                        Manage Courses
                      </Button>
                    </Box>
                    {coursesNearingCapacity && coursesNearingCapacity.length > 0 ? (
                      <List>
                        {coursesNearingCapacity.slice(0, 3).map((course, index) => (
                          <React.Fragment key={course.id}>
                            <ListItem>
                              <ListItemIcon>
                                <Warning color="warning" />
                              </ListItemIcon>
                              <ListItemText
                                primary={course.name}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      Capacity: {course.currentStudents}/{course.maxStudents} students
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {Math.round((course.currentStudents / course.maxStudents) * 100)}% filled
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label="Nearly Full"
                                color="warning"
                                size="small"
                              />
                            </ListItem>
                            {index < coursesNearingCapacity.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        All courses have available capacity
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Admission Statistics */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Admission Statistics by Course
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Course Name</TableCell>
                            <TableCell align="right">Total Applications</TableCell>
                            <TableCell align="right">Admitted</TableCell>
                            <TableCell align="right">Admission Rate</TableCell>
                            <TableCell align="right">Capacity Used</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {courseAdmissionStats.map((stat, index) => (
                            <TableRow key={index}>
                              <TableCell>{stat.courseName}</TableCell>
                              <TableCell align="right">{stat.totalApplications}</TableCell>
                              <TableCell align="right">{stat.admitted}</TableCell>
                              <TableCell align="right">{stat.admissionRate}%</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${stat.capacityUsed}%`}
                                  color={
                                    stat.capacityUsed >= 90 ? 'error' :
                                    stat.capacityUsed >= 70 ? 'warning' : 'success'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                          <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6">Add New Course</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Create and publish new courses
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
                          onClick={() => setTabValue(2)}
                        >
                          <Assignment sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                          <Typography variant="h6">Review Applications</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Process pending applications
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
                          onClick={() => setTabValue(4)}
                        >
                          <Business sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography variant="h6">Manage Faculties</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Create and organize faculties
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
            <InstituteCourses />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <InstituteApplications />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <InstituteStudents />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <InstituteFaculties />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <InstituteProfile />
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
      Stay updated with application activities and system notifications
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

export default InstituteDashboard;