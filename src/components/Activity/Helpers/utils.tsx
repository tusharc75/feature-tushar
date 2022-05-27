import { ACTIVITY_RESOURCE } from '../../../constants/helpers';
import routes from '../../Helpers/Routes';

export const get_activity_resource = (permissions) => {
  var data = [];
  for (const key in ACTIVITY_RESOURCE) {
    if (permissions[key] && permissions[key]?.isRead === true) {
      data.push({ optionLabel: routes[key].title, optionValue: key });
    }
  }
  return data;
};

export const resActivityColors = {
  // customerContact: 'rgba(254, 249, 230, 1)',
  // customerAccount: 'rgba(255, 240, 229, 1)',
  // supplierContact: 'rgba(251, 247, 233, 1)',
  // supplierAccount: 'rgba(250, 240, 233, 1)',
  // lead: '#BF360C',
  // opportunity: '#3949AB',
  // user: '#990033',
  // quote: '#CC33CC',
  // projectSales: '#003333',
  // rentalManagement: 'rgba(223, 231, 246, 1)',
  // repairJob: 'rgba(223, 231, 246, 1)',
  // transferAsset: 'rgba(222, 249, 255, 1)',
  // purchaseOrder: 'rgba(236, 241, 255, 1)',
  // deliveryTicket: 'rgba(214, 250, 233, 1)',
  // sublease: 'rgba(254, 237, 251, 1)',
  // salesOrder: 'rgba(239, 237, 254, 1)',
  // serializedAsset: '#E5E4E5',
  // bulkAssetCreation: '#EDF5FE',
  // my: '#FBE8F2',
  // task: '#FBE8F2',
  // event: '#e65100',
  // case: '#bf360c',
  // note: '#990033',
  // email: '#990033',
  // attachment: '#990033'
  customerContact: 'rgba(254, 249, 230, 1)',
  customerAccount: 'rgba(255, 240, 229, 1)',
  supplierContact: 'rgba(251, 247, 233, 1)',
  supplierAccount: 'rgba(250, 240, 233, 1)',
  lead: 'rgba(169, 43, 3, .1)',
  opportunity: 'rgba(255, 92, 0, .1)',
  user: 'rgba(56, 56, 56, .1)',
  quote: 'rgba(169, 43, 3, .1)',
  projectSales: 'rgba(0, 122, 149, .1)',
  rentalManagement: 'rgba(223, 231, 246, 1)',
  repairJob: 'rgba(223, 231, 246, 1)',
  transferAsset: 'rgba(222, 249, 255, 1)',
  purchaseOrder: 'rgba(236, 241, 255, 1)',
  deliveryTicket: 'rgba(214, 250, 233, 1)',
  sublease: 'rgba(254, 237, 251, 1)',
  salesOrder: 'rgba(239, 237, 254, 1)',
  serializedAsset: 'rgba(56, 56, 56, .1)',
  bulkAssetCreation: 'rgba(1, 68, 146, .1)',
  my: 'rgba(132, 0, 47, .1)',
  task: 'rgba(132, 0, 47, .1)',
  event: 'rgba(0, 129, 67, .1)',
  case: 'rgba(132, 0, 47, .1)',
  note: 'rgba(255, 97, 9, .1)',
  email: 'rgba(255, 97, 9, .1)',
  attachment: 'rgba(0, 40, 101, .1)'
};

export const resActivityTextColors = {
  customerContact: 'rgba(210, 127, 2, 1)',
  customerAccount: 'rgba(255, 92, 0, 1)',
  supplierContact: 'rgba(255, 142, 9, 1)',
  supplierAccount: 'rgba(255, 97, 9, 1)',
  lead: 'rgba(169, 43, 3, 1)',
  opportunity: 'rgba(255, 92, 0, 1)',
  user: 'rgba(56, 56, 56, 1)',
  quote: 'rgba(169, 43, 3, 1)',
  projectSales: 'rgba(0, 122, 149, 1)',
  rentalManagement: 'rgba(7, 43, 97, 1)',
  repairJob: 'rgba(169, 43, 3, 1)',
  transferAsset: 'rgba(0, 122, 149, 1)',
  purchaseOrder: 'rgba(0, 40, 101, 1)',
  deliveryTicket: 'rgba(0, 129, 67, 1)',
  sublease: 'rgba(176, 1, 85, 1)',
  salesOrder: 'rgba(35, 7, 175, 1)',
  serializedAsset: 'rgba(56, 56, 56, 1)',
  bulkAssetCreation: 'rgba(1, 68, 146, 1)',
  my: 'rgba(132, 0, 47, 1)',
  task: 'rgba(132, 0, 47, 1)',
  event: 'rgba(0, 129, 67, 1)',
  case: 'rgba(132, 0, 47, 1)',
  note: 'rgba(255, 97, 9, 1)',
  email: 'rgba(255, 97, 9, 1)',
  attachment: 'rgba(0, 40, 101, 1)'
};

export const SubCaseColors = {
  'To Do': 'var(--danger-light)',
  'In Progress': '#F57C00',
  Done: 'green'
};
