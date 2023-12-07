import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

export const fetchTaxRate = async (taxCode = null) => {
  const response = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${taxCode}`);
  return response?.data?.data || [];
};
