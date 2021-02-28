import axios from "axios";
const BASE_URL = "https://equipt-oms-v2.herokuapp.com";

const axiosAPI = () => {
    const token = localStorage.getItem("token");

    return axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
    });
};
export default axiosAPI