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
  common: common.en,
  
  // App
  app: {
    name: common.en.appName
  },
  
  // Auth & Home
  auth: auth.en,
  home: auth.en.home,
  login: auth.en.loginForm,
  
  // Admin
  admin: {
    ...admin.en,
    tenants: garage.en.tenants
  },
  
  // Garage Admin
  garageAdmin: garage.en.garageAdmin,
  
  // Users
  users: users.en,
  
  // Locations
  locations: locations.en,
  
  // Roles & Navigation
  roles: roles.en.roles,
  nav: roles.en.nav,
  header: roles.en.header,
  delivery: roles.en.delivery,
  washer: roles.en.washer,
  wasplanner: roles.en.wasplanner,
  workshop: roles.en.workshop,
  languages: roles.en.languages,
  
  // Subscription & Pricing
  subscription: subscription.en,
  pricing: subscription.en.pricing,
  
  // Landing page
  landing: landing.en,
  
  // Legal
  privacy: legal.en.privacy,
  terms: legal.en.terms,
  cookies: legal.en.cookies,
  
  // Documentation
  docs: docs.en
}