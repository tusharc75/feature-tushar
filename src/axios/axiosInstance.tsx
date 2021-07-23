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
        if (navigator) {
            let bandwidth = navigator["connection"].downlink
            if (bandwidth * 1000 <= 400) {
                if (localStorage.getItem("slowInternetConnection") !== "true") {
                    localStorage.setItem("slowInternetConnection", "true")
                }
            }
            else if (localStorage.getItem("slowInternetConnection") === "true") {
                localStorage.setItem("slowInternetConnection", "false")
            }
        }
        return request;
    }, error => {
        return Promise.reject(error);
    });

    axiosInstance.interceptors.response.use((response) =>
        new Promise((resolve, reject) => {
            resolve(response);
        }), (error) => {
            if (error.request.responseType === 'blob' && error.response.data.type.toLowerCase().indexOf('json') != -1) {
                return new Promise(async (resolve, reject) => {
                    const bufferArray = await error.response.data.text()
                    const err = JSON.parse(bufferArray);
                    reject({ open: true, type: "error", message: err.error });
                })
            }
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