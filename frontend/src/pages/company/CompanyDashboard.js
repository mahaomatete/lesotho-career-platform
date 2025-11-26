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
  Chip
} from '@mui/material';
import {
  Work,
  People,
  TrendingUp,
  Business,
  Schedule,
  AccountCircle,
  ExitToApp,
  Notifications,
  Dashboard,
  Assignment,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import actual components
import CompanyJobs from './CompanyJobs';
import CompanyApplications from './CompanyApplications';
import CompanyCandidates from './CompanyCandidates';
import CompanyProfile from './CompanyProfile';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
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

const CompanyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching company dashboard data...');
      
      const response = await api.get('/company/dashboard');
      
      if (response.data.success) {
        console.log('✅ Dashboard data received:', response.data.data);
        setDashboardData(response.data.data);
        setError('');
      } else {
        console.error('❌ API returned error:', response.data.message);
        setError(response.data.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard:', err);
      const errorMessage = err.response?.data?.message || err.message;
      
      if (err.response?.status === 404) {
        setError('Company dashboard endpoint not found. Please check backend routes.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your company account approval status.');
      } else {
        setError('Error loading dashboard data: ' + errorMessage);
      }
      
      // Create fallback data for demo purposes
      setDashboardData({
        companyInfo: {
          companyName: user?.companyName || 'Your Company',
          email: user?.email,
          isApproved: user?.isApproved || false,
          profileComplete: '50%'
        },
        stats: {
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          newApplications: 0,
          qualifiedCandidates: 0,
          hiredCandidates: 0,
          shortlistedCandidates: 0,
          applicationConversion: '0%'
        },
        recentApplications: [],
        jobsNearingDeadline: [],
        qualifiedCandidates: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/profile/notifications');
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
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
      await api.patch(`/profile/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '100%' }} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Use dashboard data or fallback
  const data = dashboardData || {
    companyInfo: {
      companyName: user?.companyName || 'Your Company',
      isApproved: user?.isApproved || false,
      profileComplete: '50%'
    },
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      newApplications: 0,
      qualifiedCandidates: 0,
      hiredCandidates: 0,
      shortlistedCandidates: 0,
      applicationConversion: '0%'
    },
    recentApplications: [],
    qualifiedCandidates: []
  };

  const { companyInfo, stats, recentApplications, qualifiedCandidates } = data;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Career Platform - Company Portal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error">
              <Notifications />
            </Badge>
            <Typography variant="body2">
              {companyInfo.companyName}
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); setTabValue(4); }}>
                <AccountCircle sx={{ mr: 1 }} />
                Company Profile
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
            Welcome back, {companyInfo.companyName}!
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Company Recruitment Portal - Find qualified candidates and manage job postings
          </Typography>
          
          {error && (
            <Alert severity="warning" sx={{ mt: 2 }} action={
              <Button color="inherit" size="small" onClick={fetchDashboardData}>
                RETRY
              </Button>
            }>
              {error}
            </Alert>
          )}

          {!companyInfo.isApproved && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your company account is pending approval. Some features may be limited until approved by admin.
            </Alert>
          )}

          {companyInfo.profileComplete !== '100%' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your company profile is {companyInfo.profileComplete} complete. 
              <Button 
                color="inherit" 
                size="small" 
                sx={{ ml: 1 }}
                onClick={() => setTabValue(4)}
              >
                Complete Profile
              </Button>
            </Alert>
          )}
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Jobs"
              value={stats.activeJobs || 0}
              subtitle={`${stats.totalJobs || 0} total`}
              icon={<Work />}
              color="primary"
              onClick={() => setTabValue(1)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Applications"
              value={stats.totalApplications || 0}
              subtitle={`${stats.newApplications || 0} new`}
              icon={<People />}
              color="secondary"
              onClick={() => setTabValue(2)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Qualified Candidates"
              value={stats.qualifiedCandidates || 0}
              subtitle="Ready for interview"
              icon={<TrendingUp />}
              color="success"
              onClick={() => setTabValue(3)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Hired"
              value={stats.hiredCandidates || 0}
              subtitle="Successful placements"
              icon={<Business />}
              color="warning"
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
            <Tab icon={<Work />} label="Job Postings" />
            <Tab icon={<Assignment />} label="Applications" />
            <Tab icon={<Person />} label="Qualified Candidates" />
            <Tab icon={<Business />} label="Company Profile" />
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
                          <React.Fragment key={application.id || index}>
                            <ListItem>
                              <ListItemIcon>
                                <Person />
                              </ListItemIcon>
                              <ListItemText
                                primary={application.studentName || 'Unknown Student'}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      {application.jobTitle || 'Unknown Position'}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown date'}
                                    </Typography>
                                    {application.qualificationScore && (
                                      <Box sx={{ mt: 0.5 }}>
                                        <Chip 
                                          label={`${application.qualificationScore}% Match`}
                                          color={application.qualificationScore >= 80 ? 'success' : 'warning'}
                                          size="small"
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                }
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

              {/* Qualified Candidates */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Qualified Candidates
                    </Typography>
                    {qualifiedCandidates && qualifiedCandidates.length > 0 ? (
                      <List>
                        {qualifiedCandidates.slice(0, 3).map((candidate, index) => (
                          <React.Fragment key={candidate.applicationId || index}>
                            <ListItem>
                              <ListItemIcon>
                                <TrendingUp />
                              </ListItemIcon>
                              <ListItemText
                                primary={candidate.studentName || 'Highly Qualified Candidate'}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="textSecondary">
                                      Excellent match for your requirements
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Match: {candidate.qualificationScore || 85}%
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label={`${candidate.qualificationScore || 85}%`}
                                color="success"
                                size="small"
                              />
                            </ListItem>
                            {index < qualifiedCandidates.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                        No qualified candidates at the moment. Post jobs to attract candidates.
                      </Typography>
                    )}
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => setTabValue(3)}
                    >
                      Browse All Candidates
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
                          <Work sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6">Post New Job</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Create and publish job opportunities
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
                            Manage candidate applications
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
                          onClick={() => setTabValue(3)}
                        >
                          <Person sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography variant="h6">Find Candidates</Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Browse qualified candidates
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Other tabs */}
          <TabPanel value={tabValue} index={1}>
            <CompanyJobs />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <CompanyApplications />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <CompanyCandidates />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <CompanyProfile />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
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
          <React.Fragment key={notification.id || index}>
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
                primary={notification.title || 'Notification'}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {notification.message || 'No message'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown date'}
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

export default CompanyDashboard;