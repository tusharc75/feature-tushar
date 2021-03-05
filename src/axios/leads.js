import api from "./axios";

export const getLeadData = async (id) => {
  if (id) {
    const { data } = await api().get(`/lead/${id}`);
    return data;
  }
};
