import { Step } from 'react-joyride';

export const DashboardSteps: Step[] = [
  {
    title: 'Welcome to the eQuip-T',
    content: 'Click next to start the tour',
    placement: 'center',
    target: '#root'
  },
  {
    content: 'You can access quickly all the resources from here',
    title: 'Sidebar (Quick Access)',
    placement: 'right-start',
    target: '#sidebarOrDrawer'
  },
  {
    content: 'You can change entity as per role given to you',
    title: 'Entity Select',
    placement: 'bottom',
    target: '#entitySelect'
  },
  {
    content: 'Here you will see number of items available in your cart and by clicking on it, it will take you to your cart',
    title: 'Shopping Cart',
    placement: 'bottom',
    target: '#shoppingCartButton'
  },
  {
    content: 'Here you will see all the notifications throuout the application',
    title: 'Notifications',
    placement: 'bottom',
    target: '#notificationButton'
  },
  {
    content: 'Here you will see all the chat notifications related to chatter',
    title: 'Chat Notifications',
    placement: 'bottom',
    target: '#chatNotificationButton'
  },
  {
    content: 'This will start tour for you',
    title: 'Help',
    placement: 'bottom',
    target: '#helpButton'
  },
  {
    content: 'This button will give you options for viewing your profile, brand configuration and logiging out',
    title: 'User Profile Options',
    placement: 'bottom',
    target: '#userProfileIcon'
  },
  {
    content: 'This is chatter, from here you can send and recieve messages with groups or anyone from the same bran',
    title: 'Chatter',
    placement: 'top',
    target: '.global-chat'
  },
  {
    content:
      "These are all the available resources in the portal for as per roles are given to you, you will only see those resources here for which you have particular 'Read' access",
    title: 'Available resources in the portal',
    placement: 'left',
    target: '#resourcesHomeGrid'
  }
];

export const UserSteps: Step[] = [
  {
    title: 'User Resource',
    content: 'We will guide you through the usage.',
    placement: 'center',
    target: '#resourceHeader'
  },
  {
    content: 'Control flow for the user operations.',
    title: 'User Controls',
    placement: 'bottom',
    target: '#resourceOperations'
  },
  {
    content:
      'Import and Export data for the resource \n to import data first download the template and then create your records and import them directly.',
    title: 'Import, Export Data',
    placement: 'bottom',
    target: '#importExportLinks'
  },
  {
    content:
      'This is column selector, you can choose which information of the resource should appear in the grid, by default it shows all the fields.',
    title: 'Columns Selector',
    placement: 'bottom',
    target: '.ag-grid-listing-grid-header-options'
  },
  {
    content: 'This is data grid for the resource and all the records will appear here.',
    title: 'Resource Grid',
    placement: 'bottom',
    target: '.ag-grid-listing-grid'
  },
  {
    content:
      'These checkboxes are for selcting the records that appears in the grid you can select all by clicking in this or you can select particular records of each row.',
    title: 'Select Records',
    placement: 'bottom',
    target: '.ag-pinned-left-header'
  },
  {
    content: 'There will be actions in an each row according to permission to delete or clone record.',
    title: 'Grid Actions',
    placement: 'bottom',
    target: '.ag-pinned-right-header'
  },
  {
    content: 'This is for pagination in the grid.',
    title: 'Grid Pagination',
    placement: 'bottom',
    target: '.agPagination'
  },
  {
    content: "Here you can choose how many rows you'd like to see in the grid.",
    title: 'Select Row Count',
    placement: 'bottom',
    target: '.MuiTablePagination-selectRoot'
  },
  {
    content: 'Go to next and previous.',
    title: 'Next and previous',
    placement: 'bottom',
    target: '.MuiTablePagination-actions'
  }
];

/**
 *  ACCOUNTS LIST SCREEN
 */
export const AccountSteps: Step[] = [
  {
    title: 'Account Resource',
    content: 'We will guide you through the usage.',
    placement: 'center',
    target: '#resourceHeader'
  },
  {
    content: 'Control flow for the account operations.',
    title: 'Action Controls',
    placement: 'bottom',
    target: '#resourceOperations'
  },
  {
    content: 'Select between which is current entity accounts and all brand accounts',
    title: 'Type Select',
    placement: 'bottom',
    target: '#resourceTypeSelector'
  },
  {
    content: 'Select which you wish to see, you can choose between approve, disapprove or all.',
    title: 'Status Select',
    placement: 'bottom',
    target: '#approveDisapprove'
  },
  {
    content:
      'Import and Export data for the resource \n to import data first download the template and then create your records and import them directly.',
    title: 'Import, Export Data',
    placement: 'bottom',
    target: '#importExportLinks'
  },
  {
    content:
      'This is column selector, you can choose which information of the resource should appear in the grid, by default it shows all the fields.',
    title: 'Columns Selector',
    placement: 'bottom',
    target: '.ag-grid-listing-grid-header-options'
  },
  {
    content: 'This is data grid for the resource and all the records will appear here.',
    title: 'Resource Grid',
    placement: 'bottom',
    target: '.ag-grid-listing-grid'
  },
  {
    content:
      'These checkboxes are for selcting the records that appears in the grid you can select all by clicking in this or you can select particular records of each row.',
    title: 'Select Records',
    placement: 'bottom',
    target: '.ag-pinned-left-header'
  },
  {
    content: 'There will be actions in an each row according to permission to delete or clone record.',
    title: 'Grid Actions',
    placement: 'bottom',
    target: '.ag-pinned-right-header'
  },
  {
    content: 'This is for pagination in the grid.',
    title: 'Grid Pagination',
    placement: 'bottom',
    target: '.agPagination'
  },
  {
    content: "Here you can choose how many rows you'd like to see in the grid.",
    title: 'Select Row Count',
    placement: 'bottom',
    target: '.MuiTablePagination-selectRoot'
  },
  {
    content: 'Go to next and previous.',
    title: 'Next and previous',
    placement: 'bottom',
    target: '.MuiTablePagination-actions'
  }
];

/**
 *  ACCOUNTS DETAILS SCREEN
 */

export const AccountDetailsSteps: Step[] = [
  {
    title: 'Details Page Guide',
    content: 'We will guide you through the usage.',
    placement: 'center',
    target: '.detail-container'
  },
  {
    title: 'Header',
    content: 'This is page header.',
    placement: 'bottom',
    disableScrolling: true,
    disableScrollParentFix: true,
    target: '#detailHeaderPageTitle'
  },
  {
    title: 'Actions',
    content: 'These are actions for this particular record.',
    placement: 'top',
    target: '#detailHeaderPageActions'
  },
  {
    title: 'Approve Button',
    content: 'This is button will approve the account.',
    placement: 'top',
    target: '#detailApproveButton'
  },
  {
    title: 'Edit Button',
    content: 'This is for editing a current a record.',
    placement: 'top',
    target: '#detailEditButton'
  },
  {
    title: 'Delete Button',
    content: 'This will delete the current record.',
    placement: 'top',
    target: '#detailDeleteButton'
  },
  {
    title: 'Details',
    content: 'All the information about Account.',
    placement: 'right',
    target: '#a11y-tab-0'
  },
  {
    title: 'Hierarchy',
    content: 'This hierarchy to show the child of this current account.',
    placement: 'right',
    target: '#a11y-tab-1'
  },
  {
    title: 'OM-Neurons',
    content: 'Here you will see 3D visualization for all the account hierarchy and its child.',
    placement: 'right',
    target: '#a11y-tab-2'
  },
  {
    title: 'Opportunities',
    content: 'Here you will see all the opportunities that are connected with this account.',
    placement: 'top',
    target: '#opportunityAccordion'
  },
  {
    title: 'Projects',
    content: 'Here you will see all the projects that are connected with this account.',
    placement: 'top',
    target: '#projectsAccordion'
  },
  {
    title: 'Quotes',
    content: 'Here you will see all the quotes that are connected with this account.',
    placement: 'top',
    target: '#quotesAccordion'
  },
  {
    title: 'Activities',
    content: 'Here you will see all the related activities with this account.',
    placement: 'left',
    target: '#activitiesSidebar'
  },
  {
    title: 'Quick Links',
    content: 'Quick actions for related links.',
    placement: 'left',
    target: '#detailQuickLinks'
  },
  {
    title: 'Related Contacts',
    content: 'Here you will see all the related contacts with this account.',
    placement: 'left',
    target: '.account_detail_page_div3__22Pv5'
  }
];

/**
 *  CONTACTS LIST SCREEN
 */
export const ContactsSteps: Step[] = [
  {
    title: 'Contact Resource',
    content: 'We will guide you through the usage.',
    placement: 'center',
    target: '#resourceHeader'
  },
  {
    content: 'Control flow for the contact operations.',
    title: 'Action Controls',
    placement: 'bottom',
    target: '#resourceOperations'
  },
  {
    content: 'Select between which is current entity contacts and all brand contacts',
    title: 'Type Select',
    placement: 'bottom',
    target: '#resourceTypeSelector'
  },
  {
    content: 'Select which you wish to see, you can choose between approve, disapprove or all.',
    title: 'Status Select',
    placement: 'bottom',
    target: '#approveDisapprove'
  },
  {
    content:
      'Import and Export data for the resource \n to import data first download the template and then create your records and import them directly.',
    title: 'Import, Export Data',
    placement: 'bottom',
    target: '#importExportLinks'
  },
  {
    content:
      'This is column selector, you can choose which information of the resource should appear in the grid, by default it shows all the fields.',
    title: 'Columns Selector',
    placement: 'bottom',
    target: '.ag-grid-listing-grid-header-options'
  },
  {
    content: 'This is data grid for the resource and all the records will appear here.',
    title: 'Resource Grid',
    placement: 'bottom',
    target: '.ag-grid-listing-grid'
  },
  {
    content:
      'These checkboxes are for selcting the records that appears in the grid you can select all by clicking in this or you can select particular records of each row.',
    title: 'Select Records',
    placement: 'bottom',
    target: '.ag-pinned-left-header'
  },
  {
    content: 'There will be actions in an each row according to permission to delete or clone record.',
    title: 'Grid Actions',
    placement: 'bottom',
    target: '.ag-pinned-right-header'
  },
  {
    content: 'This is for pagination in the grid.',
    title: 'Grid Pagination',
    placement: 'bottom',
    target: '.agPagination'
  },
  {
    content: "Here you can choose how many rows you'd like to see in the grid.",
    title: 'Select Row Count',
    placement: 'bottom',
    target: '.MuiTablePagination-selectRoot'
  },
  {
    content: 'Go to next and previous.',
    title: 'Next and previous',
    placement: 'bottom',
    target: '.MuiTablePagination-actions'
  }
];
/**
 *  CONTACTS DETAILS SCREEN
 */

export const ContactDetailsSteps: Step[] = [
  {
    title: 'Details Page Guide',
    content: 'We will guide you through the usage.',
    placement: 'center',
    target: '.detail-container'
  },
  {
    title: 'Header',
    content: 'This is page header.',
    placement: 'bottom',
    disableScrolling: true,
    disableScrollParentFix: true,
    target: '#detailHeaderPageTitle'
  },
  {
    title: 'Actions',
    content: 'These are actions for this particular record.',
    placement: 'top',
    target: '#detailHeaderPageActions'
  },
  {
    title: 'Edit Button',
    content: 'This is for editing a current a record.',
    placement: 'top',
    target: '#detailEditButton'
  },
  {
    title: 'Delete Button',
    content: 'This will delete the current record.',
    placement: 'top',
    target: '#detailDeleteButton'
  },
  {
    title: 'Details',
    content: 'All the information about contact.',
    placement: 'right',
    target: '#a11y-tab-0'
  },
  {
    title: 'Hierarchy',
    content: 'This hierarchy to show the child of this current contact.',
    placement: 'right',
    target: '#a11y-tab-1'
  },
  {
    title: 'Opportunities',
    content: 'Here you will see all the opportunities that are connected with this contact.',
    placement: 'top',
    target: '#opportunityAccordion'
  },
  {
    title: 'Projects',
    content: 'Here you will see all the projects that are connected with this contact.',
    placement: 'top',
    target: '#projectsAccordion'
  },
  {
    title: 'Quotes',
    content: 'Here you will see all the quotes that are connected with this contact.',
    placement: 'top',
    target: '#quotesAccordion'
  },
  {
    title: 'Activities',
    content: 'Here you will see all the related activities with this contact.',
    placement: 'left',
    target: '#activitiesSidebar'
  },
  {
    title: 'Quick Links',
    content: 'Quick actions for related links.',
    placement: 'left',
    target: '#detailQuickLinks'
  }
];
