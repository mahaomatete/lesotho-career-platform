// Utility functions for the application

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Add more utility functions as needed