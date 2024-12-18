import axiosInstance from 'src/axios/axiosInstance';
import { ACTIVITY_RESOURCE } from '../../../constants/helpers';

export const get_activity_resource = (permissions, resources) => {
  var data = [];
  for (var key in ACTIVITY_RESOURCE) {
    if (permissions[key === 'quote' ? 'quoteBuilder' : key] && permissions[key === 'quote' ? 'quoteBuilder' : key]?.isRead === true) {
      data.push({ optionLabel: resources[key]?.titleSingular, optionValue: key });
    }
  }
  return data;
};

export const get_dynamic_resource = async (collaborateTools) => {
  const { data } = await axiosInstance().get(`/sa-formbuilder/dynamic-resource?collaborateTools=${collaborateTools}`);
  return data;
}

export const SubCaseColors = {
  'To Do': 'var(--danger-light)',
  'In Progress': '#F57C00',
  Done: 'green'
};
