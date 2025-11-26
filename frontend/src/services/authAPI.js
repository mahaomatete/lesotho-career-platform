// Login API call with debugging
export const loginUser = async (userData) => {
  try {
    console.log('Frontend: Sending login request for:', userData.email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email.trim(),
        password: userData.password
      }),
    });
    
    console.log('Frontend: Response status:', response.status);
    
    const data = await response.json();
    console.log('Frontend: Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.message || `Login failed with status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Frontend: Login API error:', error);
    throw error;
  }
};