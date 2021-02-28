import api from './axios'

export const deleteAccounts = async (req) => {
    const { data } = await api().put(`/account/remove`, req)
    return data;
}
export const getAccountData = async (id) => {
    if (id) {
        const { data } = await api().get(`/account/${id}`)
        return data;
    }
}
export const craeteAccount = async (request) => {
    const { data } = await api().post('/account', request)
    return data;
}