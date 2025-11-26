import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Description,
  Add,
  Delete,
  School,
  WorkspacePremium,
  Download,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState({ transcripts: [], certificates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState({ open: false, type: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, document: null, type: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    // Transcript fields
    institutionName: '',
    program: '',
    yearCompleted: '',
    gpa: '',
    // Certificate fields
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    fileUrl: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/documents');
      if (response.data.success) {
        setDocuments(response.data.data);
      } else {
        setError('Failed to load documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type) => {
    try {
      let uploadData;
      
      if (type === 'transcript') {
        uploadData = {
          institutionName: formData.institutionName,
          program: formData.program,
          yearCompleted: parseInt(formData.yearCompleted),
          gpa: parseFloat(formData.gpa),
          fileUrl: formData.fileUrl
        };
      } else {
        uploadData = {
          name: formData.name,
          issuingOrganization: formData.issuingOrganization,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate || null,
          fileUrl: formData.fileUrl
        };
      }

      const response = await api.post(
        type === 'transcript' ? '/student/transcripts' : '/student/certificates',
        uploadData
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: `${type === 'transcript' ? 'Transcript' : 'Certificate'} uploaded successfully`,
          severity: 'success'
        });
        setDialogOpen({ open: false, type: '' });
        resetForm();
        fetchDocuments();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error uploading ${type}: ${err.response?.data?.message || err.message}`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (documentId, type) => {
    try {
      // Since backend doesn't have delete endpoints, we'll simulate it
      setSnackbar({
        open: true,
        message: 'Delete functionality will be implemented when backend endpoints are available',
        severity: 'info'
      });
      setDeleteDialog({ open: false, document: null, type: '' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error deleting ${type}`,
        severity: 'error'
      });
    }
  };

  const downloadDocument = async (documentId, type, fileName) => {
    try {
      // Simulate download since backend doesn't have download endpoints
      setSnackbar({
        open: true,
        message: 'Download functionality will be implemented when backend endpoints are available',
        severity: 'info'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error downloading file',
        severity: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      institutionName: '',
      program: '',
      yearCompleted: '',
      gpa: '',
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      fileUrl: ''
    });
  };

  const openDialog = (type) => {
    setDialogOpen({ open: true, type });
    resetForm();
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
        My Documents
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Manage your academic transcripts and certificates
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Transcripts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Academic Transcripts
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openDialog('transcript')}
                >
                  Add Transcript
                </Button>
              </Box>

              {documents.transcripts && documents.transcripts.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    No transcripts uploaded yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {documents.transcripts.map((transcript) => (
                    <ListItem key={transcript.id} divider>
                      <ListItemIcon>
                        <Description color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={transcript.program}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {transcript.institutionName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Year: {transcript.yearCompleted} • GPA: {transcript.gpa}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                              Uploaded: {new Date(transcript.uploadedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          color="primary"
                          onClick={() => downloadDocument(transcript.id, 'transcript', `transcript-${transcript.id}.pdf`)}
                        >
                          <Download />
                        </IconButton>
                        <IconButton 
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, document: transcript, type: 'transcript' })}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Certificates
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openDialog('certificate')}
                >
                  Add Certificate
                </Button>
              </Box>

              {documents.certificates && documents.certificates.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <WorkspacePremium sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    No certificates uploaded yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {documents.certificates.map((certificate) => (
                    <ListItem key={certificate.id} divider>
                      <ListItemIcon>
                        <WorkspacePremium color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={certificate.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {certificate.issuingOrganization}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                              {certificate.expiryDate && ` • Expires: ${new Date(certificate.expiryDate).toLocaleDateString()}`}
                            </Typography>
                            <Typography variant="caption" display="block" color="textSecondary">
                              Uploaded: {new Date(certificate.uploadedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          color="primary"
                          onClick={() => downloadDocument(certificate.id, 'certificate', `certificate-${certificate.id}.pdf`)}
                        >
                          <Download />
                        </IconButton>
                        <IconButton 
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, document: certificate, type: 'certificate' })}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen.open} onClose={() => setDialogOpen({ open: false, type: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogOpen.type === 'transcript' ? 'Upload Transcript' : 'Upload Certificate'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogOpen.type === 'transcript' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Institution Name"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Program/ Degree"
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year Completed"
                    type="number"
                    value={formData.yearCompleted}
                    onChange={(e) => setFormData({ ...formData, yearCompleted: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GPA"
                    type="number"
                    step="0.01"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="File URL (for demo)"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://example.com/transcript.pdf"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Certificate Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Issuing Organization"
                    value={formData.issuingOrganization}
                    onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Issue Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expiry Date (Optional)"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="File URL (for demo)"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://example.com/certificate.pdf"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen({ open: false, type: '' })}>Cancel</Button>
          <Button 
            onClick={() => handleUpload(dialogOpen.type)}
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Upload {dialogOpen.type === 'transcript' ? 'Transcript' : 'Certificate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, document: null, type: '' })}>
        <DialogTitle>Delete {deleteDialog.type === 'transcript' ? 'Transcript' : 'Certificate'}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this {deleteDialog.type}?
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {deleteDialog.document?.program || deleteDialog.document?.name}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The file will be permanently removed from the system.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, document: null, type: '' })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.document.id, deleteDialog.type)}
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default StudentDocuments;