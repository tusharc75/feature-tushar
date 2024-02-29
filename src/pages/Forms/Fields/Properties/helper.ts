import { sortBy } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

export const getResource = async () => {
  const {
    data: { data }
  } = await axiosInstance().get(`${routes.forms.path}/lookup-resource`);
  return sortBy(data, ['formTitle'])?.map((e) => {
    return { optionLabel: e.formTitle, optionValue: e._id };
  });
};

export const getFields = async (lookupResource) => {
  const {
    data: { data }
  } = await axiosInstance().get(`${routes.forms.path}/lookup-fields?formId=${lookupResource}`);

  return data?.map((e) => { return { fieldName: e?.fieldName, fieldLabel: e?.fieldLabel } })
};
