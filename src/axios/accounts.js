import api from './axios'

export const deleteAccounts = async (params) => {
    if (params._id) {
        const { data } = await api().delete(`/sa-field/${params._id}`)
        return data;
    }
}
export const craeteAccount = async (request) => {
    const { data } = await api().post('/account', request)
    return data;
}