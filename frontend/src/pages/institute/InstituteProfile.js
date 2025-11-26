import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Snackbar,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Description,
  CheckCircle,
  Edit,
  School
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const InstituteProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    type: '',
    establishedYear: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Lesotho'
    },
    contactPerson: {
      firstName: '',
      lastName: '',
      position: '',
      phone: '',
      email: ''
    },
    accreditation: {
      body: '',
      number: '',
      expiryDate: ''
    },
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/institute/profile');
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          registrationNumber: profileData.registrationNumber || '',
          type: profileData.type || '',
          establishedYear: profileData.establishedYear || '',
          description: profileData.description || '',
          website: profileData.website || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          address: profileData.address || {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Lesotho'
          },
          contactPerson: profileData.contactPerson || {
            firstName: '',
            lastName: '',
            position: '',
            phone: '',
            email: ''
          },
          accreditation: profileData.accreditation || {
            body: '',
            number: '',
            expiryDate: ''
          },
          socialMedia: profileData.socialMedia || {
            linkedin: '',
            twitter: '',
            facebook: ''
          }
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.put('/institute/profile', formData);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
        setEditMode(false);
        fetchProfile(); // Refresh profile data
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error updating profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const getProfileCompletion = () => {
    if (!formData) return 0;
    
    const fields = [
      formData.name,
      formData.type,
      formData.establishedYear,
      formData.description,
      formData.phone,
      formData.email,
      formData.address.street,
      formData.address.city,
      formData.contactPerson.firstName,
      formData.contactPerson.lastName,
      formData.contactPerson.position
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
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

  const completionPercentage = getProfileCompletion();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Institute Profile
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={`${completionPercentage}% Complete`}
            color={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'error'}
            variant="outlined"
          />
          {!editMode ? (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Institute Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1 }} />
                Institute Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Institute Name *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Registration Number"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Institute Type *</InputLabel>
                    <Select
                      value={formData.type}
                      label="Institute Type *"
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      disabled={!editMode}
                    >
                      <MenuItem value="University">University</MenuItem>
                      <MenuItem value="College">College</MenuItem>
                      <MenuItem value="Technical Institute">Technical Institute</MenuItem>
                      <MenuItem value="Vocational School">Vocational School</MenuItem>
                      <MenuItem value="Polytechnic">Polytechnic</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Established Year"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Institute Description *"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editMode}
                    placeholder="Describe your institute, mission, values, academic programs, and what makes you unique..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ mr: 1 }} />
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number *"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                
                {/* Address */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                    Address
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address *"
                    value={formData.address.street}
                    onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City *"
                    value={formData.address.city}
                    onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={formData.address.state}
                    onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={formData.address.postalCode}
                    onChange={(e) => handleNestedInputChange('address', 'postalCode', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.address.country}
                    onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Primary Contact Person
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name *"
                    value={formData.contactPerson.firstName}
                    onChange={(e) => handleNestedInputChange('contactPerson', 'firstName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    value={formData.contactPerson.lastName}
                    onChange={(e) => handleNestedInputChange('contactPerson', 'lastName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position *"
                    value={formData.contactPerson.position}
                    onChange={(e) => handleNestedInputChange('contactPerson', 'position', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.contactPerson.phone}
                    onChange={(e) => handleNestedInputChange('contactPerson', 'phone', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => handleNestedInputChange('contactPerson', 'email', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Accreditation */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accreditation Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Accreditation Body"
                    value={formData.accreditation.body}
                    onChange={(e) => handleNestedInputChange('accreditation', 'body', e.target.value)}
                    disabled={!editMode}
                    placeholder="e.g., Council on Higher Education"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Accreditation Number"
                    value={formData.accreditation.number}
                    onChange={(e) => handleNestedInputChange('accreditation', 'number', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.accreditation.expiryDate}
                    onChange={(e) => handleNestedInputChange('accreditation', 'expiryDate', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Profile Completion */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Completion
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={completionPercentage} 
                    color={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'error'}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {completionPercentage}%
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Complete your profile to improve student trust and attract better applicants.
              </Typography>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={profile?.isApproved ? 'Verified' : 'Pending Approval'} 
                  color={profile?.isApproved ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                {profile?.isApproved 
                  ? 'Your institute account is verified and active.'
                  : 'Your account is pending admin approval. Some features may be limited.'
                }
              </Typography>
            </CardContent>
          </Card>

          {/* Institute Statistics */}
          {profile?.stats && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Institute Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Courses:</Typography>
                    <Typography variant="body2" fontWeight="bold">{profile.stats.totalCourses}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Faculties:</Typography>
                    <Typography variant="body2" fontWeight="bold">{profile.stats.totalFaculties}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Students:</Typography>
                    <Typography variant="body2" fontWeight="bold">{profile.stats.totalStudents}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Applications:</Typography>
                    <Typography variant="body2" fontWeight="bold">{profile.stats.totalApplications}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Social Media */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Social Media
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) => handleNestedInputChange('socialMedia', 'linkedin', e.target.value)}
                    disabled={!editMode}
                    placeholder="https://linkedin.com/school/..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleNestedInputChange('socialMedia', 'twitter', e.target.value)}
                    disabled={!editMode}
                    placeholder="https://twitter.com/..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facebook"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleNestedInputChange('socialMedia', 'facebook', e.target.value)}
                    disabled={!editMode}
                    placeholder="https://facebook.com/..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      {editMode && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveProfile}
            disabled={saving}
            startIcon={<CheckCircle />}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </Box>
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

export default InstituteProfile;