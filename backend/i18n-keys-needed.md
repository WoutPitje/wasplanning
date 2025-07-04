# I18n Translation Keys Needed

This document lists all the translation keys that need to be added to the i18n configuration after updating the Vue page files.

## Common Keys
- `common.cancel`
- `common.edit`
- `common.active`
- `common.inactive`
- `common.login`

## App Keys
- `app.name`

## Home Page
- `home.subtitle`
- `home.description`
- `home.metaTitle`
- `home.metaDescription`

## Login Page
- `login.title`
- `login.subtitle`
- `login.email`
- `login.emailPlaceholder`
- `login.password`
- `login.passwordPlaceholder`
- `login.error`
- `login.loggingIn`
- `login.loginButton`

## Admin Settings Page
- `admin.settings.title`
- `admin.settings.subtitle`
- `admin.settings.systemConfig`
- `admin.settings.placeholder`

## Admin Tenants Pages

### Edit Page
- `admin.tenants.edit.title`
- `admin.tenants.edit.titleWithName`
- `admin.tenants.edit.subtitle`
- `admin.tenants.edit.loading`
- `admin.tenants.edit.loadError`
- `admin.tenants.edit.garageInfo`
- `admin.tenants.edit.garageInfoDescription`
- `admin.tenants.edit.systemName`
- `admin.tenants.edit.systemNameInfo`
- `admin.tenants.edit.displayName`
- `admin.tenants.edit.displayNamePlaceholder`
- `admin.tenants.edit.logoUrl`
- `admin.tenants.edit.logoUrlPlaceholder`
- `admin.tenants.edit.status`
- `admin.tenants.edit.garageActive`
- `admin.tenants.edit.updateError`
- `admin.tenants.edit.updating`
- `admin.tenants.edit.updateButton`
- `admin.tenants.edit.updateSuccess`
- `admin.tenants.edit.updateSuccessDescription`

### Details Page
- `admin.tenants.details.title`
- `admin.tenants.details.subtitle`
- `admin.tenants.details.loading`
- `admin.tenants.details.loadError`
- `admin.tenants.details.garageInfo`
- `admin.tenants.details.displayName`
- `admin.tenants.details.systemName`
- `admin.tenants.details.status`
- `admin.tenants.details.createdAt`
- `admin.tenants.details.logo`
- `admin.tenants.details.statistics`
- `admin.tenants.details.totalUsers`
- `admin.tenants.details.activeUsers`
- `admin.tenants.details.statsLoading`
- `admin.tenants.details.users`
- `admin.tenants.details.noUsers`

### Breadcrumb
- `admin.breadcrumb.admin`
- `admin.breadcrumb.garages`
- `admin.breadcrumb.details`
- `admin.breadcrumb.edit`

## Delivery Schedule Page
- `delivery.schedule.completedWashes`
- `delivery.schedule.completedWashesDescription`
- `delivery.schedule.returnPlanning`
- `delivery.schedule.returnPlanningDescription`
- `delivery.schedule.urgentDeliveries`
- `delivery.schedule.urgentDeliveriesDescription`

## Garage Admin Pages

### Dashboard
- `garageAdmin.dashboard.userManagement`
- `garageAdmin.dashboard.userManagementDescription`
- `garageAdmin.dashboard.garageSettings`
- `garageAdmin.dashboard.garageSettingsDescription`
- `garageAdmin.dashboard.reports`
- `garageAdmin.dashboard.reportsDescription`

### Settings
- `garageAdmin.settings.title`
- `garageAdmin.settings.subtitle`
- `garageAdmin.settings.generalSettings`
- `garageAdmin.settings.placeholder`

### Users
- `garageAdmin.users.title`
- `garageAdmin.users.subtitle`
- `garageAdmin.users.overview`
- `garageAdmin.users.placeholder`

## Washer Queue Page
- `washer.queue.myTasks`
- `washer.queue.myTasksDescription`
- `washer.queue.availableTasks`
- `washer.queue.availableTasksDescription`

## Wasplanner Dashboard Page
- `wasplanner.dashboard.queueManagement`
- `wasplanner.dashboard.queueManagementDescription`
- `wasplanner.dashboard.assignments`
- `wasplanner.dashboard.assignmentsDescription`
- `wasplanner.dashboard.planningOverview`
- `wasplanner.dashboard.planningOverviewDescription`

## Workshop Requests Page
- `workshop.requests.newRequests`
- `workshop.requests.newRequestsDescription`
- `workshop.requests.newRequestButton`
- `workshop.requests.myRequests`
- `workshop.requests.myRequestsDescription`

## Notes
- The files `/admin/tenants/create.vue` and `/admin/tenants/index.vue` already had i18n implemented
- All other Vue page files have been updated to use the `t()` function from vue-i18n
- These keys should be added to the i18n configuration files in both Dutch (nl) and English (en) locales