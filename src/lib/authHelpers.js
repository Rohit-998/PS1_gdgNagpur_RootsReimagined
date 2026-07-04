// Client-side auth helpers for dashboard pages
// Works with the existing mg_token / mg_user localStorage system

/**
 * Read the stored user object from localStorage
 * @returns {Object|null} user object or null
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mg_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Read the stored auth token from localStorage
 * @returns {string|null}
 */
export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mg_token') || null;
}

/**
 * Build Authorization header object for fetch calls
 * @returns {Object} headers object (may be empty if no token)
 */
export function buildAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Redirect to /login if user is not authenticated or doesn't have the required role.
 * Call this inside a useEffect on dashboard pages.
 * @param {Function} router - Next.js router (from useRouter())
 * @param {string|string[]} [allowedRoles] - optional role(s) required
 * @returns {Object|null} user if valid, null if redirecting
 */
export function requireAuth(router, allowedRoles = []) {
  const user = getStoredUser();
  const token = getStoredToken();

  if (!user || !token) {
    router.push('/login');
    return null;
  }

  if (allowedRoles.length > 0) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(user.role)) {
      router.push('/login');
      return null;
    }
  }

  return user;
}

/**
 * Resolve the correct dashboard path for a user's role
 * @param {string} role
 * @returns {string} dashboard path
 */
export function getDashboardHref(role) {
  switch (role) {
    case 'unassigned':  return '/onboarding';
    case 'pharmacy':    return '/dashboard/pharmacy';
    case 'manufacturer':return '/dashboard/company';
    case 'regulator':   return '/dashboard/company'; // regulators see company-style view
    default:            return '/dashboard/consumer';
  }
}
