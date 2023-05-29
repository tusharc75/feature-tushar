import { ACTIVITY_RESOURCE } from '../../../constants/helpers';
import routes from '../../Helpers/Routes';

export const get_activity_resource = (permissions) => {
  var data = [];
  for (var key in ACTIVITY_RESOURCE) {
    if (permissions[key === 'quote' ? 'quoteBuilder' : key] && permissions[key === 'quote' ? 'quoteBuilder' : key]?.isRead === true) {
      data.push({ optionLabel: routes[key].title, optionValue: key });
    }
  }
  return data;
};

export const SubCaseColors = {
  'To Do': 'var(--danger-light)',
  'In Progress': '#F57C00',
  Done: 'green'
};
