import * as common from './common'
import * as auth from './auth'
import * as admin from './admin'
import * as garage from './garage'
import * as users from './users'
import * as locations from './locations'
import * as roles from './roles'
import * as subscription from './subscription'
import * as landing from './landing'
import * as legal from './legal'
import * as docs from './docs'

export const nl = {
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

export const en = {
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