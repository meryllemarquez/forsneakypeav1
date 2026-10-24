// The accounts have no gender/persona field, so the fallback doodle is picked from the
// account names (Starshine = Merylle, Junebug = Cj). Admins get the star.
export function avatarDoodle(user) {
  if (user?.role === 'ROLE_ADMIN') return 'star';
  const who = `${user?.username || ''} ${user?.name || ''} ${user?.nickname || ''}`.toLowerCase();
  return /\b(cj|junebug)\b/.test(who) ? 'him' : 'her';
}
