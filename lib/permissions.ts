export type AppRole =
  | 'owner'
  | 'admin'
  | 'finance'
  | 'moderator'
  | 'teacher'
  | 'member'

export const ALL_ROLES: AppRole[] = [
  'owner',
  'admin',
  'finance',
  'moderator',
  'teacher',
  'member',
]

// Owner's governance task:
// appoint Admins or remove Admins back to Member.
export const OWNER_ASSIGNABLE_ROLES: AppRole[] = [
  'admin',
  'member',
]

// Admin's operational task:
// appoint lower offices and run the app.
// Admin cannot appoint Owner or Admin.
export const ADMIN_ASSIGNABLE_ROLES: AppRole[] = [
  'finance',
  'moderator',
  'teacher',
  'member',
]

export const BOARD_MESSAGE_ROLES: AppRole[] = [
  'owner',
  'admin',
  'moderator',
  'teacher',
]

export function canManageRoles(role: string | null | undefined) {
  return role === 'owner' || role === 'admin'
}

export function getAssignableRoles(role: string | null | undefined): AppRole[] {
  if (role === 'owner') return OWNER_ASSIGNABLE_ROLES
  if (role === 'admin') return ADMIN_ASSIGNABLE_ROLES
  return []
}

export function canDeleteUsers(role: string | null | undefined) {
  // Keep account deletion very restricted.
  // Later we can make this target-aware:
  // owner can delete admin; admin can delete lower offices/members.
  return role === 'owner'
}

export function canBroadcastMessages(role: string | null | undefined) {
  return role === 'owner' || role === 'admin'
}

export function canReceiveMemberMessages(role: string | null | undefined) {
  return BOARD_MESSAGE_ROLES.includes(role as AppRole)
}

export function canManageGiving(role: string | null | undefined) {
  return role === 'admin' || role === 'finance'
}

export function canManageMeetings(role: string | null | undefined) {
  return role === 'admin' || role === 'moderator'
}

export function canManageCalendar(role: string | null | undefined) {
  return role === 'admin' || role === 'moderator'
}

export function canManageBooks(role: string | null | undefined) {
  return role === 'admin'
}

export function canManageBookAccess(role: string | null | undefined) {
  return role === 'admin'
}

export function canManageConnectLinks(role: string | null | undefined) {
  return role === 'admin'
}

export function canPostAnnouncements(role: string | null | undefined) {
  return role === 'admin' || role === 'teacher' || role === 'moderator'
}

export function canCreatePosts(role: string | null | undefined) {
  return role === 'admin' || role === 'teacher' || role === 'moderator'
}

export function canModeratePosts(role: string | null | undefined) {
  return role === 'admin' || role === 'moderator'
}

export function canManageStudyResources(role: string | null | undefined) {
  return role === 'admin' || role === 'teacher'
}
