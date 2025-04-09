import React, { useState } from 'react';

type ContextValue = {
  leftSearchValue: string;
  setLeftSearchValue: React.Dispatch<React.SetStateAction<ContextValue['leftSearchValue']>>;
  technicianSearchValue: string;
  setTechnicianSearchValue: React.Dispatch<React.SetStateAction<ContextValue['technicianSearchValue']>>;
};

const TechnicianContext = React.createContext<ContextValue>(null);

const Provider = ({ children }: { children: React.ReactChild }) => {
  const [leftSearchValue, setLeftSearchValue] = useState('');
  const [technicianSearchValue, setTechnicianSearchValue] = useState('');
  return (
    <TechnicianContext.Provider value={{ leftSearchValue, setLeftSearchValue, technicianSearchValue, setTechnicianSearchValue }}>
      {children}
    </TechnicianContext.Provider>
  );
};

export default Provider;

export const useTechnicianContext = () => {
  const context = React.useContext(TechnicianContext);
  if (!context) {
    throw new Error('TechnicianContext must be used within a TechnicianContext Provider.');
  }
  return context;
};
