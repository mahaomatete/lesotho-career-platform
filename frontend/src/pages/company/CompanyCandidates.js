import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
  Pagination,
  TextField
} from '@mui/material';
import {
  Person,
  School,
  Work,
  TrendingUp,
  WorkspacePremium,
  Email,
  Phone,
  CheckCircle,
  HowToReg
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CompanyCandidates = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    minScore: 70
  });

  const [hireData, setHireData] = useState({
    position: '',
    salary: '',
    startDate: ''
  });

  useEffect(() => {
    fetchCandidates();
  }, [page, filters]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('minScore', filters.minScore);
      queryParams.append('page', page);
      queryParams.append('limit', '8');

      const response = await api.get(`/company/qualified-candidates?${queryParams}`);
      
      if (response.data.success) {
        setCandidates(response.data.data.candidates || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(response.data.message || 'Failed to load candidates');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      // Create demo data for testing
      const demoCandidates = [
        {
          applicationId: '1',
          studentId: 'student1',
          studentName: 'John Doe',
          studentEmail: 'john.doe@student.com',
          studentPhone: '+266 1234 5678',
          jobTitle: 'Software Developer',
          qualificationScore: 85,
          status: 'pending',
          appliedAt: new Date().toISOString(),
          academicPerformance: { averageGPA: '3.8' },
          certificatesCount: 3,
          experience: '2 years',
          educationLevel: 'Bachelor\'s Degree',
          coverLetter: 'I am passionate about software development and have experience in modern web technologies.'
        },
        {
          applicationId: '2',
          studentId: 'student2',
          studentName: 'Sarah Smith',
          studentEmail: 'sarah.smith@student.com',
          studentPhone: '+266 2345 6789',
          jobTitle: 'Marketing Intern',
          qualificationScore: 78,
          status: 'shortlisted',
          appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          academicPerformance: { averageGPA: '3.5' },
          certificatesCount: 2,
          experience: '1 year',
          educationLevel: 'Diploma',
          coverLetter: 'I have experience in digital marketing and social media management.'
        }
      ];
      setCandidates(demoCandidates);
      setTotalPages(1);
      setError('Using demo data - Backend connection issue');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailDialogOpen(true);
  };

  const handleContactCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setContactMessage(`Dear ${candidate.studentName}, we are impressed with your qualifications for the ${candidate.jobTitle} position and would like to invite you for an interview.`);
    setContactDialogOpen(true);
  };

  const handleHireCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setHireData({
      position: candidate.jobTitle || '',
      salary: '',
      startDate: ''
    });
    setHireDialogOpen(true);
  };

  const sendInterviewInvitation = async () => {
    try {
      setSnackbar({
        open: true,
        message: `Interview invitation sent to ${selectedCandidate.studentName}`,
        severity: 'success'
      });
      setContactDialogOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error sending interview invitation',
        severity: 'error'
      });
    }
  };

  const acceptCandidate = async () => {
    try {
      const response = await api.patch(`/company/applications/${selectedCandidate.applicationId}/status`, {
        status: 'hired',
        notes: 'Candidate hired for position'
      });
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Candidate hired successfully!',
          severity: 'success'
        });
        setHireDialogOpen(false);
        setDetailDialogOpen(false);
        fetchCandidates();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error hiring candidate: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    }
  };

  const getQualificationColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

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
        Qualified Candidates
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Top candidates automatically filtered based on your job requirements
      </Typography>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Minimum Qualification Score: {filters.minScore}%
              </Typography>
              <input
                type="range"
                min="50"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ minScore: 70 })}
                fullWidth
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {candidates.length > 0 ? candidates.map((candidate) => (
          <Grid item xs={12} md={6} key={candidate.applicationId || candidate.id}>
            <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">
                        {candidate.studentName || 'Unknown Candidate'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {candidate.studentEmail || 'No email'}
                      </Typography>
                      {candidate.phone && (
                        <Typography variant="caption" color="textSecondary">
                          {candidate.phone}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip 
                    label={`${candidate.qualificationScore || 0}% Match`}
                    color={getQualificationColor(candidate.qualificationScore || 0)}
                  />
                </Box>

                <Typography variant="body2" gutterBottom>
                  Applied for: <strong>{candidate.jobTitle || 'Unknown Position'}</strong>
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <School sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        GPA: {candidate.academicPerformance?.averageGPA || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {candidate.certificatesCount || 0} certs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {candidate.experience || 'No experience'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <WorkspacePremium sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {candidate.educationLevel || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Applied: {candidate.appliedAt ? new Date(candidate.appliedAt).toLocaleDateString() : 'Unknown date'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleViewProfile(candidate)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => handleHireCandidate(candidate)}
                      startIcon={<HowToReg />}
                    >
                      Hire
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Qualified Candidates Found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {filters.minScore > 70 
                    ? `No candidates meet the ${filters.minScore}% qualification threshold. Try lowering the minimum score.`
                    : 'No candidates have met the qualification criteria for your job postings yet.'
                  }
                </Typography>
                {filters.minScore > 70 && (
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => setFilters({ ...filters, minScore: 70 })}
                  >
                    Lower Minimum Score to 70%
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}

      {/* Candidate Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Candidate Profile - {selectedCandidate?.studentName || 'Unknown Candidate'}
        </DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Full Name:</strong> {selectedCandidate.studentName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedCandidate.studentEmail}</Typography>
                  </Grid>
                  {selectedCandidate.phone && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedCandidate.phone}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Applied For:</strong> {selectedCandidate.jobTitle}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Qualification Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color={getQualificationColor(selectedCandidate.qualificationScore || 0)}>
                          {selectedCandidate.qualificationScore || 0}%
                        </Typography>
                        <Typography variant="body2">Overall Match</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {selectedCandidate.academicPerformance?.averageGPA || 'N/A'}
                        </Typography>
                        <Typography variant="body2">GPA Score</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {selectedCandidate.certificatesCount || 0}
                        </Typography>
                        <Typography variant="body2">Certificates</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {selectedCandidate.experienceYears || 0}
                        </Typography>
                        <Typography variant="body2">Years Exp</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Actions</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => handleContactCandidate(selectedCandidate)}
                  >
                    Contact for Interview
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<HowToReg />}
                    onClick={() => handleHireCandidate(selectedCandidate)}
                  >
                    Hire Candidate
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hire Candidate Dialog */}
      <Dialog open={hireDialogOpen} onClose={() => setHireDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Hire {selectedCandidate?.studentName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to hire {selectedCandidate?.studentName} for the position of {selectedCandidate?.jobTitle}.
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Position"
                value={hireData.position}
                onChange={(e) => setHireData({ ...hireData, position: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salary Offer"
                value={hireData.salary}
                onChange={(e) => setHireData({ ...hireData, salary: e.target.value })}
                placeholder="e.g., M15,000 per month"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={hireData.startDate}
                onChange={(e) => setHireData({ ...hireData, startDate: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={acceptCandidate}
            variant="contained" 
            color="success"
            startIcon={<HowToReg />}
          >
            Confirm Hire
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Candidate Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Contact {selectedCandidate?.studentName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Send an interview invitation to {selectedCandidate?.studentName} for the position of {selectedCandidate?.jobTitle}.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Message:</strong>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder={`Dear ${selectedCandidate?.studentName}, we are impressed with your qualifications and would like to invite you for an interview...`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={sendInterviewInvitation}
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Send Interview Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CompanyCandidates;