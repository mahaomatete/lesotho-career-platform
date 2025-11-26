import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  People,
  School,
  Business,
  Download,
  Assignment,
  Work,
  BarChart,
  Receipt,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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

const AdminReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('user_registrations');
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [tabValue, setTabValue] = useState(0);

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports?reportType=${reportType}&startDate=&endDate=`);
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get(`/admin/reports/export?reportType=${reportType}&timeRange=${timeRange}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error exporting report');
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getGrowthIndicator = (current, previous) => {
    if (!previous || previous === 0) return null;
    const growth = ((current - previous) / previous) * 100;
    return (
      <Chip 
        label={`${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
        color={growth > 0 ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'user_registrations':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>User Registration Report</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Registrations"
                  value={reportData.summary?.totalRegistrations || 0}
                  icon={<People />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Students"
                  value={reportData.summary?.studentRegistrations || 0}
                  icon={<School />}
                  color="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Institutions"
                  value={reportData.summary?.instituteRegistrations || 0}
                  icon={<Business />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Companies"
                  value={reportData.summary?.companyRegistrations || 0}
                  icon={<Work />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'application_stats':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Application Statistics Report</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Applications"
                  value={reportData.summary?.totalApplications || 0}
                  icon={<Assignment />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Admitted"
                  value={reportData.summary?.statusBreakdown?.admitted || 0}
                  icon={<CheckCircle />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Pending"
                  value={reportData.summary?.statusBreakdown?.pending || 0}
                  icon={<Pending />}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Admission Rate"
                  value={reportData.summary?.admissionRate || '0%'}
                  icon={<TrendingUp />}
                  color="info"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'job_postings':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Job Postings Report</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Jobs"
                  value={reportData.summary?.totalJobs || 0}
                  icon={<Work />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Jobs"
                  value={reportData.summary?.activeJobs || 0}
                  icon={<Business />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Closed Jobs"
                  value={reportData.summary?.statusBreakdown?.closed || 0}
                  icon={<Block />}
                  color="error"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Applications"
                  value={reportData.summary?.totalApplications || 0}
                  icon={<Assignment />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 'system_usage':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>System Usage Report</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Activities"
                  value={reportData.summary?.totalActivities || 0}
                  icon={<Analytics />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Peak Usage"
                  value={reportData.summary?.peakUsage?.peakHour || 'N/A'}
                  icon={<TrendingUp />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Avg Daily Users"
                  value={reportData.summary?.peakUsage?.averageDailyUsers || 0}
                  icon={<People />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Reports & Analytics
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Generate comprehensive system reports and view analytics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Report Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="user_registrations">User Registrations</MenuItem>
                  <MenuItem value="application_stats">Application Statistics</MenuItem>
                  <MenuItem value="job_postings">Job Postings</MenuItem>
                  <MenuItem value="admission_stats">Admission Statistics</MenuItem>
                  <MenuItem value="system_usage">System Usage</MenuItem>
                  <MenuItem value="revenue_reports">Revenue Reports</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                  <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                  <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                  <MenuItem value="this_year">This Year</MenuItem>
                  <MenuItem value="last_year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={generateReport}
                disabled={loading}
                fullWidth
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportReport}
                disabled={!reportData}
                fullWidth
              >
                Export Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Analytics />} label="Summary" />
          <Tab icon={<BarChart />} label="Charts" />
          <Tab icon={<TableChart />} label="Detailed Data" />
          <Tab icon={<TrendingUp />} label="Trends" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Report Results */}
          {reportData && (
            <Box>
              {renderReportContent()}

              {/* Additional Summary Information */}
              {reportData.period && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Report Period</Typography>
                    <Typography>
                      From: {new Date(reportData.period.start).toLocaleDateString()} 
                      {' '}To: {new Date(reportData.period.end).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Placeholder for when no report is generated */}
          {!reportData && !loading && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <TrendingUp sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Report Generated
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Select a report type and click "Generate Report" to view analytics
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<TrendingUp />}
                  onClick={generateReport}
                  sx={{ mt: 2 }}
                >
                  Generate First Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Charts Placeholder */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analytics Charts
              </Typography>
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Box textAlign="center">
                  <BarChart sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Interactive charts would be displayed here
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    (Integration with charting libraries like Chart.js or Recharts)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Detailed Data Table */}
          {reportData && reportData.detailed && reportData.detailed.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Report Data
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {Object.keys(reportData.detailed[0]).map((key) => (
                          <TableCell key={key}>
                            <Typography variant="subtitle2">
                              {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.detailed.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Trends Analysis */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trend Analysis
              </Typography>
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 1
              }}>
                <Box textAlign="center">
                  <TrendingUp sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Trend analysis and forecasting
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    (Monthly trends, growth patterns, and predictions)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      )}
    </Box>
  );
};

// Missing icon components
const CheckCircle = () => <span>✓</span>;
const Pending = () => <span>⏳</span>;
const Block = () => <span>❌</span>;
const TableChart = () => <span>📊</span>;

export default AdminReports;