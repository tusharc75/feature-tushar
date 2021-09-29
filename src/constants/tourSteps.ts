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
    target: '#userResourceTitle'
  },
  {
    content: 'Control flow for the user operations.',
    title: 'User Controls',
    placement: 'bottom',
    target: '#userOperations'
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
