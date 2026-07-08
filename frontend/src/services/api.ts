const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Only set Content-Type if the body is not FormData and options.body exists
  if (options.body && !(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle file downloads (Excel blobs)
  const contentType = response.headers.get('content-type');
  if (
    (contentType && (contentType.includes('application/octet-stream') || contentType.includes('vnd.openxmlformats-officedocument'))) ||
    endpoint.includes('/export')
  ) {
    if (!response.ok) {
      throw new Error('Error al descargar el archivo.');
    }
    return response; // Return the full response for blob processing
  }

  // Parse JSON
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición.');
  }
  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: RequestInit) => {
    const bodyContent = body instanceof FormData ? body : JSON.stringify(body);
    return request(endpoint, { ...options, method: 'POST', body: bodyContent });
  },
  put: (endpoint: string, body?: any, options?: RequestInit) => {
    const bodyContent = body instanceof FormData ? body : JSON.stringify(body);
    return request(endpoint, { ...options, method: 'PUT', body: bodyContent });
  },
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
