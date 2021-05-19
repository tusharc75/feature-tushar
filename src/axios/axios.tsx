import axios from "axios";
//const BASE_URL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";
const BASE_URL="http://localhost:4000";
const axiosAPI = () => {
    const token = localStorage.getItem("token");

    return axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
    });
};
export default axiosAPI