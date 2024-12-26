import React, { createContext, useState } from 'react';
import { CustomToastProps } from 'src/components/Helpers/CustomToast';

type CustomToastContextType = {
  toastConfig: CustomToastProps;
  setToastConfig: React.Dispatch<React.SetStateAction<CustomToastProps>>;
};

export const CustomToastContext = createContext<CustomToastContextType>(null);

// This context provider is passed to any component requiring the context
export const CustomToastProvider = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<CustomToastProps>({ open: false, type: null, message: null });

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
