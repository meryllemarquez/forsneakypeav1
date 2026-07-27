const API_BASE_URL = 'http://localhost:8080/api/v1/auth';

export async function loginApi(username, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }
  return data.data; // Returns { token, username, name, role }
}

export async function registerApi({ masterPassword, name, username, password, role }) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterPassword, name, username, password, role }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data.data;
}