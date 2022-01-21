import { capitalize } from "lodash";
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../../../../axios/axiosInstance";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";

export const ECommerceContext = createContext(null);

// This context provider is passed to any component requiring the context
export const ECommerceProvider = ({ children }) => {

    const [loading, setLoading] = useState(true);
    const [orderTypes, setOrderTypes] = useState({});
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        if (loading === true) {
            axiosInstance().get(`/e-commerce-policy`).then(({ data: { data: { _id, brand, ...rest } } }) => {

                let orderTypesFromApi = {};

                Object.keys(rest).forEach((key) => {
                    if (rest[key] === true) {
                        orderTypesFromApi[key === "buy" ? "sale" : key] = {
                            key: capitalize(key),
                            value: key === "buy" ? "Sale" : capitalize(key)
                        }
                    }
                })

                setOrderTypes({ ...orderTypesFromApi });
                setLoading(false)

            }).catch((error) => {
                toastConfig.setToastConfig(error);
            })
        }
    }, [loading])

    return (
        <ECommerceContext.Provider value={{
            ORDER_TYPES: orderTypes,
            firstOrderType: Object.values(orderTypes)[0]
        }}>
            {loading ? "Loading..." : children}
        </ECommerceContext.Provider>
    );
};