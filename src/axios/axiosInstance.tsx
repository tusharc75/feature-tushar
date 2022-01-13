import axios from 'axios';
import { backendApi } from './../config';

const ERROR_CODE = {
    permissionError: '1001',
    forbiddenError: '1002',
    // authorizationError: '1003',
    // invalidUserError: '1004'
};
Object.freeze(ERROR_CODE);

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
            history.push("/");
            history.push("/login");
        }
        // else {
        //     // history.push('/');
        //     //@ts-ignore
        //     window.location = "/";
        // }
    }

    axiosInstance.interceptors.request.use((request) => {
        if (navigator) {
            //@ts-ignore
            let bandwidth = navigator["connection"]?.downlink //in mb/s
            let maxSlowSpeed = 400 // in kb/s
            if (bandwidth * 1000 <= maxSlowSpeed) {
                if (localStorage.getItem("slowInternetConnection") !== "true") {
                    localStorage.setItem("slowInternetConnection", "true")
                }
            }
            else if (localStorage.getItem("slowInternetConnection") === "true") {
                localStorage.setItem("slowInternetConnection", "false")
            }
        }
        // const splittedUrl = request.url.split("?");
        // if (splittedUrl.length > 1) {
        //     request.url = `${splittedUrl[0]}?${encodeURIComponent(splittedUrl[1])}`
        // }
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
            if (error.request.responseType === "arraybuffer") {
                const enc = new TextDecoder("utf-8");
                const data = enc.decode(error.response.data);
                const err = JSON.parse(data);
                return new Promise((resolve, reject) => reject({ open: true, type: "error", message: err.error, }));
            }

            // if (error.message == "Network Error") {
            //     if (navigator.onLine) {
            //         return new Promise((resolve, reject) => {
            //             reject({ open: true, type: "error", message: "Api Not Working" });
            //         })
            //     }
            // }

            if (!error.response) {
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "error", message: error.response.data.error });
                })
            }

            if (error.response.data && error.response.data.code && Object.values(ERROR_CODE).some(s => s === error.response.data.code)) {
                if (window.confirm((`${error.response.data.error}\n\nPress Ok to redirect to home\nPress Cancel to stay here`))) {
                    localStorage.removeItem("selectedEntity");
                    //@ts-ignore
                    window.location = "/";
                }
            } else if (error.response.status === 511) {
                localStorage.clear();
                //@ts-ignore
                window.location = "/";
            } else if (error.response.data && error.response.data.code && error.response.data.code === "1005") {
                return new Promise((resolve, reject) => {
                    reject({ open: true, type: "notFoundError", message: "" });
                });
            }
            else {
                if (error.response.status === 401) {
                    clearTokenAndRedirectToHome();
                    return new Promise((resolve, reject) => {
                        reject({ open: true, type: "error", message: error.response.data.error || error.response.data.message });
                    });

                }
                else if (error.response.status === 511) {
                    clearTokenAndRedirectToHome();
                }
                else {
                    return new Promise((resolve, reject) => {
                        reject({ open: true, type: "error", message: error.response.data.error || error.response.data.message, data: error.response.data });
                    })
                }
            }

            // reject(error);
        }
    );

    return axiosInstance;
}