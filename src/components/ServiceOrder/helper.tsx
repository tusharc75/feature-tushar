import { CHILD_RESOURCE } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_service_order_detail_fields = async (currency) => {
  var data;
  const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE?.fieldServiceOrderDetails}`);
  data = response?.data?.data;
  data = CURReplaceByCurrencySingle(data, currency ? currency : 'USD');
  return data;
};

export const fetch_service_order_addOn_fields = async (currency) => {
  var data;
  const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.fieldServiceOrderAddon}`);
  data = response?.data?.data;
  data = CURReplaceByCurrencySingle(data, currency ? currency : 'USD');
  return data;
};
