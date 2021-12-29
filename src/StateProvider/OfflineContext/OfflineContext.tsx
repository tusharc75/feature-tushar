import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../../axios/axiosInstance";
import { rentalManagement, sidebarResource } from "../../constants/helpers";
import { CustomToastContext } from "../CustomToastContext/CustomToastContext";

export const CustomOfflineContext = createContext(null);
const limit = 500;

let dataToFetch = [];
Object.keys(sidebarResource).forEach((key) => {
    dataToFetch.push({
        key: key,
        value: sidebarResource[key]
    })
})

export const CustomOfflineProvider = ({ children }) => {

    const toastConfig = useContext(CustomToastContext);

    const [isOffline, setIsOffline] = useState(false)

    const [offlineFieldsData, setOfflineFieldsData] = useState(null);
    const [offlineGridData, setOfflineGridData] = useState(null);

    useEffect(() => {
        passDataToSave();
    }, [isOffline])

    window.addEventListener(
        'load',
        function (e) {
            if (navigator.onLine) {
                if (isOffline) setIsOffline(false);
            } else {
                setIsOffline(true);
            }
        },
        false
    );

    window.addEventListener('online', function (e) {
        setIsOffline(false)
    });

    window.addEventListener('offline', function (e) {
        setIsOffline(true)
    });

    const passDataToSave = () => {
        if (!isOffline && localStorage.getItem("offlineDataToSave")) {
            try {
                const offlineDataToSave = JSON.parse(localStorage.getItem("offlineDataToSave"));

                Promise.all(Object.keys(offlineDataToSave).map(async offlineData => {
                    await offlineDataToSave[offlineData].forEach(async m => {
                        if (m.method === "get") {
                            await axiosInstance().get(m.api);
                        }
                        else if (m.method === "post") {
                            await axiosInstance().post(m.api, m.values);
                        }
                        else if (m.method === "put") {
                            await axiosInstance().put(m.api, m.values);
                        }
                    });

                })).then(() => {
                    localStorage.removeItem("offlineDataToSave");
                    // fetchFieldsData();
                })
            } catch (ex) {

            }
        }
    }

    const updateFieldsData = (module, data) => {
        let initializeOfflineData = {}
        initializeOfflineData[module] = {
            ...data
        }
        try {
            const storedLocalStorageOfflineFieldsData = JSON.parse(localStorage.getItem("offlineFieldsData"));

            if (storedLocalStorageOfflineFieldsData) {
                storedLocalStorageOfflineFieldsData[module] = initializeOfflineData[module];

                setOfflineFieldsData(storedLocalStorageOfflineFieldsData);
                localStorage.setItem("offlineFieldsData", JSON.stringify(storedLocalStorageOfflineFieldsData));

            } else {
                setOfflineFieldsData(initializeOfflineData);
                localStorage.setItem("offlineFieldsData", JSON.stringify(initializeOfflineData));
            }
        } catch (ex) {

        }

    }

    const fetchFieldsData = (module) => {
        if (module) {
            const getModule = dataToFetch.find(d => d.key === module);
            if (getModule) {

                let initializeOfflineData = {}

                const apis = {
                    fieldsApis: [getModule],
                    // gridDataApis: [getModule]
                }

                Promise.all(apis.fieldsApis.map(async field => {
                    await axiosInstance().get(`/field?resource=${field.value}`).then(({ data: { data } }) => {
                        initializeOfflineData[field.key] = data;
                    })
                    // await axiosInstance().get(`${rentalManagementApi}?limit=${limit}`).then(({ data: { data } }) => {
                    //     initializeOfflineData.gridData[field.key] = data;
                    // })
                })).then(() => {
                    try {
                        const storedLocalStorageOfflineFieldsData = JSON.parse(localStorage.getItem("offlineFieldsData"));

                        if (storedLocalStorageOfflineFieldsData) {
                            storedLocalStorageOfflineFieldsData[module] = initializeOfflineData[module];

                            setOfflineFieldsData(storedLocalStorageOfflineFieldsData);
                            localStorage.setItem("offlineFieldsData", JSON.stringify(storedLocalStorageOfflineFieldsData));

                        } else {
                            setOfflineFieldsData(initializeOfflineData);
                            localStorage.setItem("offlineFieldsData", JSON.stringify(initializeOfflineData));
                        }
                    } catch (ex) {

                    }
                });
            }
        }
    }

    const updateOfflineGridData = (module, data, recordsToDelete = []) => {

        if (navigator.onLine) {
            fetchFieldsData(module);
        }

        try {
            const storedLocalStorageOfflineGridData = JSON.parse(localStorage.getItem("offlineGridData"));

            if (storedLocalStorageOfflineGridData) {

                if (!storedLocalStorageOfflineGridData[module]) {
                    let initializeOfflineGridData = {
                        ...storedLocalStorageOfflineGridData,
                        [module]: data
                    }

                    setOfflineGridData(initializeOfflineGridData);
                    localStorage.setItem("offlineGridData", JSON.stringify(initializeOfflineGridData));

                } else {

                    data.forEach(d => {
                        const indexOfExistingRecord = storedLocalStorageOfflineGridData[module].findIndex(f => f._id === d._id);

                        if (indexOfExistingRecord === -1) {
                            storedLocalStorageOfflineGridData[module].push(d);
                        } else {
                            storedLocalStorageOfflineGridData[module][indexOfExistingRecord] = d;
                        }
                    });

                    recordsToDelete.forEach(_id => {
                        storedLocalStorageOfflineGridData[module] = storedLocalStorageOfflineGridData[module].filter(f => f._id !== _id);
                    });

                    setOfflineGridData(storedLocalStorageOfflineGridData);
                    localStorage.setItem("offlineGridData", JSON.stringify(storedLocalStorageOfflineGridData));
                }

            } else {
                let initializeOfflineGridData = {
                    [module]: data
                }

                setOfflineGridData(initializeOfflineGridData);
                localStorage.setItem("offlineGridData", JSON.stringify(initializeOfflineGridData));
            }
        } catch (ex) {

        }
    }

    useEffect(() => {
        // if (navigator.onLine) {
        //     fetchFieldsData();
        // } 
        // else {
        // if (localStorage.getItem("offlineData")) {
        //     try {
        //         setOfflineData(JSON.parse(localStorage.getItem("offlineData")));
        //     } catch (ex) {
        //         toastConfig.setToastConfig({ open: true, type: "error", message: "Facing issue while getting offline data" });
        //     }
        // }
        // // }
    }, [])

    return (
        <CustomOfflineContext.Provider
            value={{ isOffline, offlineFieldsData, offlineGridData, fetchFieldsData, updateOfflineGridData, updateFieldsData }}
        >
            {children}
        </CustomOfflineContext.Provider>
    );
};