import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Link,
  Container,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const steps = ['Account Type', 'Basic Information', 'Complete'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    role: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    institutionName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data for API
      const submitData = { ...formData };
      delete submitData.confirmPassword;

      const result = await register(submitData);
      if (result.success) {
        // Auto-verification success message
        const successMessage = 'Registration successful! Your account has been automatically verified. You can now login.';
        
        navigate('/login', { 
          state: { message: successMessage }
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              select
              margin="normal"
              required
              fullWidth
              name="role"
              label="Account Type"
              value={formData.role}
              onChange={handleChange}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="institute">Educational Institute</MenuItem>
              <MenuItem value="company">Company</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </TextField>
            <Alert severity="info" sx={{ mt: 2 }}>
              All accounts are automatically verified. You can login immediately after registration.
            </Alert>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <TextField
              margin="normal"
              required
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
              helperText={formData.password !== formData.confirmPassword && formData.confirmPassword !== '' ? 'Passwords do not match' : ''}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            {formData.role === 'student' && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </>
            )}
            {formData.role === 'institute' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="institutionName"
                label="Institution Name"
                value={formData.institutionName}
                onChange={handleChange}
              />
            )}
            {formData.role === 'company' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="companyName"
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange}
              />
            )}
            {formData.role === 'admin' && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  name="firstName"
                  label="First Name (Optional)"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  name="lastName"
                  label="Last Name (Optional)"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return !!formData.role;
      case 1:
        return formData.email && 
               formData.password && 
               formData.confirmPassword && 
               formData.password === formData.confirmPassword &&
               formData.password.length >= 6;
      case 2:
        if (formData.role === 'student') {
          return formData.firstName && formData.lastName;
        } else if (formData.role === 'institute') {
          return formData.institutionName;
        } else if (formData.role === 'company') {
          return formData.companyName;
        } else if (formData.role === 'admin') {
          // Admin fields are optional
          return true;
        }
        return false;
      default:
        return false;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Career Platform
            </Typography>
            <Typography variant="h5" align="center" gutterBottom>
              Create Account
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={activeStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {renderStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isStepValid() || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {activeStep === steps.length - 1 
                    ? (loading ? 'Creating Account...' : 'Create Account')
                    : 'Next'
                  }
                </Button>
              </Box>
            </Box>

            <Box textAlign="center" mt={2}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;