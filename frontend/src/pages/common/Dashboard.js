import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  School,
  Business,
  People,
  Work,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { capitalizeFirst, formatDate } from '../../utils/helpers';
import api from '../../services/api';

const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Card>
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

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let response;

      // Fetch role-specific dashboard data
      switch (user?.role) {
        case 'admin':
          response = await api.get('/admin/dashboard');
          break;
        case 'institute':
          response = await api.get('/institute/dashboard');
          break;
        case 'student':
          response = await api.get('/student/dashboard');
          break;
        case 'company':
          response = await api.get('/company/dashboard');
          break;
        default:
          response = await api.get('/profile/dashboard');
      }

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
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

  // Generate stats based on user role and real data
  const getStats = () => {
    if (!dashboardData.stats) return [];

    const { stats, companyInfo, instituteInfo, studentInfo } = dashboardData;

    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Total Users', value: stats.totalUsers || '0', subtitle: `${stats.totalStudents || 0} students`, icon: <People /> },
          { title: 'Institutions', value: stats.totalInstitutions || '0', subtitle: `${stats.pendingApprovals?.institutions || 0} pending`, icon: <School /> },
          { title: 'Companies', value: stats.totalCompanies || '0', subtitle: `${stats.pendingApprovals?.companies || 0} pending`, icon: <Business /> },
          { title: 'Active Applications', value: stats.totalApplications || '0', subtitle: 'Across system', icon: <TrendingUp /> },
        ];
      
      case 'institute':
        return [
          { title: 'Total Courses', value: stats.totalCourses || '0', subtitle: `${stats.activeCourses || 0} active`, icon: <School /> },
          { title: 'Applications', value: stats.totalApplications || '0', subtitle: `${stats.pendingApplications || 0} pending`, icon: <People /> },
          { title: 'Admitted Students', value: stats.admittedStudents || '0', subtitle: `${stats.admissionRate || '0%'} rate`, icon: <TrendingUp /> },
          { title: 'Faculties', value: stats.totalFaculties || '0', subtitle: 'All departments', icon: <Business /> },
        ];
      
      case 'student':
        return [
          { title: 'My Applications', value: stats.totalApplications || '0', subtitle: `${stats.pendingApplications || 0} pending`, icon: <Work /> },
          { title: 'Admitted', value: stats.admittedApplications || '0', subtitle: `${stats.successRate || '0%'} success`, icon: <TrendingUp /> },
          { title: 'Institutions', value: stats.appliedInstitutions || '0', subtitle: 'Applied to', icon: <School /> },
          { title: 'Documents', value: (stats.transcriptsUploaded || 0) + (stats.certificatesUploaded || 0), subtitle: 'Uploaded', icon: <Schedule /> },
        ];
      
      case 'company':
        return [
          { title: 'Active Jobs', value: stats.activeJobs || '0', subtitle: `${stats.totalJobs || 0} total`, icon: <Work /> },
          { title: 'Applications', value: stats.totalApplications || '0', subtitle: `${stats.newApplications || 0} new`, icon: <People /> },
          { title: 'Hired', value: stats.hiredCandidates || '0', subtitle: 'This period', icon: <TrendingUp /> },
          { title: 'Shortlisted', value: stats.shortlistedCandidates || '0', subtitle: 'For interviews', icon: <Business /> },
        ];
      
      default:
        return [];
    }
  };

  const getUserInfo = () => {
    return dashboardData.companyInfo || dashboardData.instituteInfo || dashboardData.studentInfo || dashboardData.userInfo || {};
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {getUserInfo().firstName || getUserInfo().institutionName || getUserInfo().companyName || user?.email || 'User'}!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        {user?.role === 'admin' && 'System Administration Dashboard'}
        {user?.role === 'institute' && 'Educational Institute Management'}
        {user?.role === 'student' && 'Student Career Portal'}
        {user?.role === 'company' && 'Company Recruitment Dashboard'}
      </Typography>

      {/* Profile Completion Alert */}
      {getUserInfo().profileComplete && getUserInfo().profileComplete !== '100%' && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          Your profile is {getUserInfo().profileComplete} complete. 
          <Typography component="span" sx={{ ml: 1, fontWeight: 'bold', cursor: 'pointer' }} onClick={() => window.location.href = '/profile'}>
            Complete your profile
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {getStats().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity Section */}
      {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: index < dashboardData.recentActivities.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">
                    {activity.message || activity.action}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={capitalizeFirst(activity.type || 'info')}
                      size="small"
                      color={activity.type || 'info'}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(activity.createdAt || activity.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Applications for Students/Companies/Institutes */}
      {(dashboardData.recentApplications && dashboardData.recentApplications.length > 0) && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Applications
            </Typography>
            <Box sx={{ mt: 2 }}>
              {dashboardData.recentApplications.slice(0, 5).map((application, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: index < dashboardData.recentApplications.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {application.courseName || application.jobTitle || 'Application'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {application.instituteName || application.companyName}
                    </Typography>
                  </Box>
                  <Chip
                    label={capitalizeFirst(application.status)}
                    size="small"
                    color={
                      application.status === 'admitted' || application.status === 'hired' ? 'success' :
                      application.status === 'rejected' ? 'error' : 'warning'
                    }
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {user?.role === 'student' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/student/courses'}
                  >
                    <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2">Browse Courses</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/student/applications'}
                  >
                    <Work sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2">My Applications</Typography>
                  </Card>
                </Grid>
              </>
            )}
            {user?.role === 'institute' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/institute/courses'}
                  >
                    <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2">Manage Courses</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/institute/applications'}
                  >
                    <People sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2">View Applications</Typography>
                  </Card>
                </Grid>
              </>
            )}
            {user?.role === 'company' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/company/jobs'}
                  >
                    <Work sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2">Post New Job</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/company/applications'}
                  >
                    <People sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2">View Candidates</Typography>
                  </Card>
                </Grid>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/admin/institutions'}
                  >
                    <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2">Manage Institutions</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    variant="outlined" 
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => window.location.href = '/admin/companies'}
                  >
                    <Business sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2">Manage Companies</Typography>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;