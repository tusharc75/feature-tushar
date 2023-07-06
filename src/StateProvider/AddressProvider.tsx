import React, { createContext, useState } from "react";

export const NewAddressOptionList = createContext(null)

export const NewAddressOptionListProvider = ({ children }) => {

    const [newAddressOptionList, setNewAddressOptionList] = useState([]);

    return (
        <NewAddressOptionList.Provider
            value={{
                newAddressOptionList,
                setNewAddressOptionList
            }}
        >
            {children}
        </NewAddressOptionList.Provider>
    );
};
