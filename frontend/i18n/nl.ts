import * as common from './modules/common'
import * as auth from './modules/auth'
import * as admin from './modules/admin'
import * as garage from './modules/garage'
import * as users from './modules/users'
import * as locations from './modules/locations'
import * as roles from './modules/roles'
import * as subscription from './modules/subscription'
import * as landing from './modules/landing'
import * as legal from './modules/legal'
import * as docs from './modules/docs'

export default {
  // Common
  common: common.nl,
  
  // App
  app: {
    name: common.nl.appName
  },
  
  // Auth & Home
  auth: auth.nl,
  home: auth.nl.home,
  login: auth.nl.loginForm,
  
  // Admin
  admin: {
    ...admin.nl,
    tenants: garage.nl.tenants
  },
  
  // Garage Admin
  garageAdmin: garage.nl.garageAdmin,
  
  // Users
  users: users.nl,
  
  // Locations
  locations: locations.nl,
  
  // Roles & Navigation
  roles: roles.nl.roles,
  nav: roles.nl.nav,
  header: roles.nl.header,
  delivery: roles.nl.delivery,
  washer: roles.nl.washer,
  wasplanner: roles.nl.wasplanner,
  workshop: roles.nl.workshop,
  languages: roles.nl.languages,
  
  // Subscription & Pricing
  subscription: subscription.nl,
  pricing: subscription.nl.pricing,
  
  // Landing page
  landing: landing.nl,
  
  // Legal
  privacy: legal.nl.privacy,
  terms: legal.nl.terms,
  cookies: legal.nl.cookies,
  
  // Documentation
  docs: docs.nl
}