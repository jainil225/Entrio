import api from './client';

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Admin Events
export const getAdminEvents = () => api.get('/admin/events');
export const getAdminEvent = (id: string) => api.get(`/admin/events/${id}`);
export const createEvent = (data: any) => api.post('/admin/events', data);
export const updateEvent = (id: string, data: any) => api.put(`/admin/events/${id}`, data);
export const publishEvent = (id: string, is_published: boolean) =>
  api.patch(`/admin/events/${id}/publish`, { is_published });
export const addTicketType = (eventId: string, data: any) =>
  api.post(`/admin/events/${eventId}/ticket-types`, data);
export const deleteTicketType = (ttId: string) =>
  api.delete(`/admin/events/ticket-types/${ttId}`);
export const getEventBookings = (eventId: string) =>
  api.get(`/admin/events/${eventId}/bookings`);

// Store
export const getPublicEvents = () => api.get('/store/events');
export const getPublicEvent = (id: string) => api.get(`/store/events/${id}`);
export const createBooking = (data: any) => api.post('/store/bookings', data);
