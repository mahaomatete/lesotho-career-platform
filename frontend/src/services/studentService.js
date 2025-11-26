import api from './api';

const studentService = {
  // Course applications
  async getCourses(filters = {}) {
    const response = await api.get('/student/courses', { params: filters });
    return response.data;
  },

  async applyForCourse(courseId, personalStatement, additionalInfo = {}) {
    const response = await api.post('/student/applications', {
      courseId,
      personalStatement,
      additionalInfo
    });
    return response.data;
  },

  async getApplications(filters = {}) {
    const response = await api.get('/student/applications', { params: filters });
    return response.data;
  },

  async withdrawApplication(applicationId) {
    const response = await api.delete(`/student/applications/${applicationId}`);
    return response.data;
  },

  async acceptOffer(applicationId) {
    const response = await api.put(`/student/applications/${applicationId}/accept`);
    return response.data;
  },

  // Job applications
  async getJobs(filters = {}) {
    const response = await api.get('/student/jobs', { params: filters });
    return response.data;
  },

  async applyForJob(jobId, coverLetter) {
    const response = await api.post('/student/job-applications', {
      jobId,
      coverLetter
    });
    return response.data;
  },

  async getJobApplications(filters = {}) {
    const response = await api.get('/student/job-applications', { params: filters });
    return response.data;
  },

  // Documents
  async uploadTranscript(transcriptData) {
    const response = await api.post('/student/transcripts', transcriptData);
    return response.data;
  },

  async uploadCertificate(certificateData) {
    const response = await api.post('/student/certificates', certificateData);
    return response.data;
  },

  async getDocuments() {
    const response = await api.get('/student/documents');
    return response.data;
  },

  // Institutions and Faculties
  async getInstitutions() {
    const response = await api.get('/student/institutions');
    return response.data;
  },

  async getFaculties() {
    const response = await api.get('/student/faculties');
    return response.data;
  },

  // Dashboard
  async getDashboard() {
    const response = await api.get('/student/dashboard');
    return response.data;
  },

  // Notifications
  async getNotifications(limit = 20) {
    const response = await api.get('/student/notifications', { params: { limit } });
    return response.data;
  },

  async markNotificationAsRead(notificationId) {
    const response = await api.put(`/student/notifications/${notificationId}/read`);
    return response.data;
  }
};

export default studentService;