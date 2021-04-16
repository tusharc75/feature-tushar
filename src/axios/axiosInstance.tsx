import axios from 'axios';

export default (history = null) => {
    const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";

    let headers: any = {};

    if (localStorage.token) {
        headers.Authorization = `Bearer ${localStorage.token}`;
    }

    const entityId = localStorage.getItem("selectedEntity");
    if (entityId) {
        headers.entity = entityId;
    }

    const axiosInstance = axios.create({
        baseURL: baseURL,
        headers
    });

    function clearTokenAndRedirectToHome() {
        localStorage.removeItem('token');

        if (history) {
            history.push('/');
        }
        else {
            // history.push('/');
            //@ts-ignore
            window.location = "/";
        }
    }

    axiosInstance.interceptors.request.use((request) => {
        return request;
    }, error => {
        return Promise.reject(error);
    });

    axiosInstance.interceptors.response.use((response) =>
        new Promise((resolve, reject) => {
            resolve(response);
        }), (error) => {
            if (error.message == "Network Error") {
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "error", message: "Api Not Working" });
                })
            }

            if (!error.response) {
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "error", message: error.response.data.error });
                })
            }

            if (error.response.status === 401) {
                clearTokenAndRedirectToHome();
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "error", message: error.response.data.message });
                });

            }
            else {
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "error", message: error.response.data.error || error.response.data.message });
                })
            }

            // reject(error);
        }
    );

    return axiosInstance;
}