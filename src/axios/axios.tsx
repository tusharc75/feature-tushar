import axios from "axios";
import { backendApi } from './../config';

const axiosAPI = () => {
    const token = localStorage.getItem("token");

    return axios.create({
        baseURL: backendApi,
        headers: { Authorization: `Bearer ${token}` },
    });
};
export default axiosAPI