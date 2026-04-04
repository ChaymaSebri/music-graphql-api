import { rule, shield, and, or } from 'graphql-shield'

/**
 * Authentication & Authorization Rules
 * Used with graphql-shield middleware
 */

// ============================================
// BASIC RULES
// ============================================

/**
 * User is authenticated (has valid JWT token)
 */
export const isAuthenticated = rule({
  cache: 'contextual',
})(async (parent, args, { user }) => {
  return !!user
})

/**
 * User has ARTIST role
 */
export const isArtist = rule({
  cache: 'contextual',
})(async (parent, args, { user }) => {
  return user?.role === 'ARTIST'
})

/**
 * User has LISTENER role
 */
export const isListener = rule({
  cache: 'contextual',
})(async (parent, args, { user }) => {
  return user?.role === 'LISTENER'
})

/**
 * User is either ARTIST or LISTENER
 */
export const isAnyUser = or(isArtist, isListener)

// ============================================
// RESOURCE-SPECIFIC RULES
// ============================================

/**
 * Can create/upload content (Artists only)
 */
export const canCreate = isArtist

/**
 * Can review songs (Listeners primarily, but Artists can too)
 */
export const canReview = isAnyUser

/**
 * Can manage own content (Artists)
 */
export const canManageContent = isArtist

/**
 * Can delete resources (Admin function, restricted)
 */
export const canDelete = isArtist

// ============================================
// COMPOSITION RULES
// ============================================

/**
 * Authenticated AND artist
 */
export const authAndArtist = and(isAuthenticated, isArtist)

/**
 * Authenticated AND listener
 */
export const authAndListener = and(isAuthenticated, isListener)

/**
 * Public read: Anyone can read
 */
export const isPublic = rule({
  cache: 'contextual',
})(() => true)
