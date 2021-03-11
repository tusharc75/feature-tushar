import axios from 'axios';
import { CustomEventEmitter } from './events';

export default (history = null) => {
    const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";

    let headers = {};

    if (localStorage.token) {
        headers.Authorization = `Bearer ${localStorage.token}`;
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
            history.push('/');
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
                    CustomEventEmitter.dispatch("show-toast", { type: "error", errorMsg: "Api Not Working" });
                    reject(error);
                })
            }

            if (!error.response) {
                return new Promise((resolve, reject) => {
                    CustomEventEmitter.dispatch("show-toast", { type: "error", errorMsg: error.response.data.error });
                    reject(error);
                })
            }

            if (error.response.status === 401) {
                CustomEventEmitter.dispatch("show-toast", { type: "error", errorMsg: error.response.data.message });
                clearTokenAndRedirectToHome();

            }
            if (error.response.status === 500) {
                CustomEventEmitter.dispatch("show-toast", { type: "error", errorMsg: error.response.data.message });
                clearTokenAndRedirectToHome();

            }
            else if (error.response.status === 403) {
                clearTokenAndRedirectToHome();
                //  redirect to home screens
            }
            else {
                return new Promise((resolve, reject) => {
                    CustomEventEmitter.dispatch("show-toast", { type: "error", errorMsg: error.response.data.error || error.response.data.message });
                    reject(error);
                })
            }

            // reject(error);
        }
    );

    return axiosInstance;
}