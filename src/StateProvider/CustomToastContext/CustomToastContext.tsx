import React, { createContext, useState } from "react";

export const CustomToastContext = createContext(null);

// This context provider is passed to any component requiring the context
export const CustomToastProvider = ({ children }) => {

    const [toastConfig, setToastConfig] = useState({ open: false, type: null, message: null });

    return (
        <CustomToastContext.Provider
            value={{
                toastConfig,
                setToastConfig
            }}
        >
            {children}
        </CustomToastContext.Provider>
    );
};