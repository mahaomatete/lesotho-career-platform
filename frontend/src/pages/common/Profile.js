import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Save,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bio: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    newsletter: false,
    language: 'en',
    theme: 'light'
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        bio: user.bio || ''
      });

      setPreferences(user.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        newsletter: false,
        language: 'en',
        theme: 'light'
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        updateUser(response.data.data);
        setEditMode(false);
      }
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.put('/profile/preferences', { preferences });
      
      if (response.data.success) {
        setSuccess('Preferences updated successfully!');
        updateUser({ ...user, preferences });
      }
    } catch (err) {
      setError('Error updating preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        setSuccess('Password changed successfully!');
      }
    } catch (err) {
      setError('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.institutionName) {
      return user.institutionName;
    } else if (user?.companyName) {
      return user.companyName;
    }
    return user?.email || 'User';
  };

  const getUserRoleDisplay = () => {
    const roleMap = {
      admin: 'Administrator',
      institute: 'Educational Institute',
      student: 'Student',
      company: 'Company'
    };
    return roleMap[user?.role] || user?.role;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Manage your account settings and preferences
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {getUserRoleDisplay()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box textAlign="left">
                <Typography variant="body2" gutterBottom>
                  <strong>Member since:</strong>{' '}
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong>{' '}
                  {user?.isVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab icon={<Person />} label="Profile" />
              <Tab icon={<Security />} label="Security" />
              <Tab icon={<Notifications />} label="Preferences" />
            </Tabs>

            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Personal Information
                </Typography>
                <Button
                  startIcon={editMode ? <Save /> : <Edit />}
                  onClick={editMode ? handleProfileUpdate : () => setEditMode(true)}
                  variant={editMode ? "contained" : "outlined"}
                  disabled={loading}
                >
                  {editMode ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!editMode || loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!editMode || loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!editMode || loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    disabled={!editMode || loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!editMode || loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!editMode || loading}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="contained"
                    onClick={handleProfileUpdate}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      // Reset form data
                      setProfileData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        address: user.address || '',
                        dateOfBirth: user.dateOfBirth || '',
                        gender: user.gender || '',
                        bio: user.bio || ''
                      });
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <PasswordChangeForm 
                onChangePassword={handlePasswordChange}
                loading={loading}
              />
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  Notification Preferences
                </Typography>
                <Button
                  startIcon={<Save />}
                  onClick={handlePreferencesUpdate}
                  variant="contained"
                  disabled={loading}
                >
                  Save Preferences
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Email Notifications
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Application Updates</Typography>
                    <Button
                      variant={preferences.emailNotifications ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
                    >
                      {preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Job Alerts</Typography>
                    <Button
                      variant={preferences.jobAlerts ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setPreferences({ ...preferences, jobAlerts: !preferences.jobAlerts })}
                    >
                      {preferences.jobAlerts ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">Newsletter</Typography>
                    <Button
                      variant={preferences.newsletter ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setPreferences({ ...preferences, newsletter: !preferences.newsletter })}
                    >
                      {preferences.newsletter ? 'Subscribed' : 'Unsubscribed'}
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Display Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Language"
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Theme"
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </TextField>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Password Change Form Component
const PasswordChangeForm = ({ onChangePassword, loading }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!passwords.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwords.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onChangePassword(passwords.currentPassword, passwords.newPassword);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={loading}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            Change Password
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default Profile;