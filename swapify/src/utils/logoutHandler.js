/**
 * Centralized logout handler to ensure consistent behavior across all pages
 * Clears auth data, navigates to login, and reloads the page
 */
export const handleLogout = (navigate) => {
  // Clear auth data from localStorage
  localStorage.removeItem('swapify.authenticated');
  localStorage.removeItem('swapify.username');
  localStorage.removeItem('swapify.email');
  
  // Navigate to login page
  navigate('/login', { replace: true });
  
  // Reload the page to reset all state
  window.location.reload();
}
