import React, { createContext, useState } from "react";

export const CustomChatNotificationCountContext = createContext(null);

// This context provider is passed to any component requiring the context
export const CustomChatNotificationCountProvider = ({ children }) => {

    const [count, setCount] = useState(0);

    return (
        <CustomChatNotificationCountContext.Provider
            value={{
                count,
                setCount
            }}
        >
            {children}
        </CustomChatNotificationCountContext.Provider>
    );
};