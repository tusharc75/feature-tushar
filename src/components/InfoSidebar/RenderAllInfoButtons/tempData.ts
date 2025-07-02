export const tempInfoData = [
  {
    _id: '1',
    itemSelector: '#bread-crumb-1',
    url: '/rental-management',
    anchorElementPadding: { paddingRight: '30px', paddingTop: '8px', paddingBottom: '8px' },
    buttonPosition: { right: 0, top: '0px' },
    data: `<h1>Listing Page Rental</h1>`,
    tooltip: 'Information'
  },
  {
    _id: '2',
    itemSelector: '#bread-crumb-2',
    url: '/rental-management/detail/:id',
    anchorElementPadding: { paddingRight: '30px', paddingTop: '8px', paddingBottom: '8px' },
    buttonPosition: { right: 0, top: '0px' },
    data: `<h1>Details Page Rental</h1>`,
    tooltip: 'Information'
  },
  {
    _id: '3',
    itemSelector: '#step-add-products-active',
    url: '/rental-management/detail/:id?tab=1',
    anchorElementPadding: {},
    buttonPosition: { top: '0px', left: '0px' },
    data: `<h1>Add Step Page Rental</h1>`,
    tooltip: 'Information'
  }
] as const;
