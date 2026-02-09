import { jwtDecode } from 'jwt-decode';

export function getUsernameFromToken(token: string): string | null {
  try {
    const decoded: any = jwtDecode(token);
    console.log('Decoded JWT:', decoded); // Debug para ver qué campos tiene el token
    
    // Intentar diferentes campos comunes para el username
    return decoded.username || 
           decoded.user || 
           decoded.sub || 
           decoded.user_name || 
           decoded.name || 
           decoded.email || 
           decoded.user_id ||
           null;
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}
