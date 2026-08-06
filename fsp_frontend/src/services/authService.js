import api from '../api/axiosConfig';

export const authService = {
  // Flexible login handler supporting both login({ username, password }) AND login(username, password)
  login: async (credentials, passwordArg) => {
    const isObject = typeof credentials === 'object' && credentials !== null;
    
    const payload = isObject
      ? {
          username: credentials.username || credentials.email,
          password: credentials.password,
        }
      : {
          username: credentials,
          password: passwordArg,
        };

    const response = await api.post('/auth/login', payload);

    // Support unwrapping ApiResponse wrapper or direct payload
    const authData = response.data?.data || response.data;
    if (authData?.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
    }
    return authData;
  },

  // Flexible register handler supporting both object payload AND positional arguments
  register: async (registerData, passwordArg, nameArg, masterPasswordArg) => {
    const isObject = typeof registerData === 'object' && registerData !== null;

    const payload = isObject
      ? {
          name: registerData.name,
          username: registerData.username,
          password: registerData.password,
          masterPassword: registerData.masterPassword || registerData.masterPasscode || '0617',
        }
      : {
          username: registerData,
          password: passwordArg,
          name: nameArg,
          masterPassword: masterPasswordArg || '0617',
        };

    const response = await api.post('/auth/register', payload);

    const authData = response.data?.data || response.data;
    if (authData?.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
    }
    return authData;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};