
import { ACTIVITY_RESOURCE } from '../../../constants/helpers';
import routes from '../../Helpers/Routes';

export const get_activity_resource = (permissions) => {
  var data = [];
  for (const key in ACTIVITY_RESOURCE) {
    if (permissions[key] && permissions[key]?.isRead === true) {
      data.push({ optionLabel: routes[key].title, optionValue: key })
    }
  }
  return data;
}

export const resActivityColors = {
  customerContact: "#F57C00",
  customerAccount: "#E65100",
  supplierContact: "#FF9800",
  supplierAccount: "#FF6E40",
  lead: "#BF360C",
  opportunity: "#3949AB",
  user: "#990033",
  quote: "#CC33CC",
  projectSales: "#003333",
  rentalManagement: "#041562",
  repairJob: "#B33030",
  transferAsset: "#1572A1",
  purchaseOrder: "#11468F",
  deliveryTicket: "#91C483",
  sublease: "#ffb3c6",
  salesOrder: "#11468F",
  my: "#990033",
  task: "#3949ab",
  event: "#e65100",
  case: "#bf360c",
  note: "#990033",
  email: "#990033",
  attachment: "#990033",
};

export const SubCaseColors = {
  "To Do": "var(--danger-light)",
  "In Progress": "#F57C00",
  "Done": "green"
};

