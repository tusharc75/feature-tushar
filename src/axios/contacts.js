import api from './axios'

export const deleteContacts = async (params) => {
    if (params._id) {
        const { data } = await api().delete(`/sa-field/${params._id}`)
        return data;
    }
}