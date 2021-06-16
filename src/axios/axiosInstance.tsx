import axios from 'axios';
import { backendApi } from './../config';

export default (history = null, passedHeaders = null) => {
    let headers: any = passedHeaders ? passedHeaders : {};

    if (localStorage.token) {
        headers.Authorization = `Bearer ${localStorage.token}`;
    }

    const entityId = localStorage.getItem("selectedEntity");
    if (entityId) {
        headers.entity = entityId;
    }

    const axiosInstance = axios.create({
        baseURL: backendApi,
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