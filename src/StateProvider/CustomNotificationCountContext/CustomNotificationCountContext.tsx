import React, { createContext, useState } from "react";

export const CustomNotificationCountContext = createContext(null);

// This context provider is passed to any component requiring the context
export const CustomNotificationCountProvider = ({ children }) => {

    const [count, setCount] = useState(0);

    return (
        <CustomNotificationCountContext.Provider
            value={{
                count,
                setCount
            }}
        >
            {children}
        </CustomNotificationCountContext.Provider>
    );
};