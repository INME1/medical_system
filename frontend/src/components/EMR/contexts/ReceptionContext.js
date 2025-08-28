// src/context/ReceptionContext.js
import { createContext, useContext, useState } from 'react';

const ReceptionContext = createContext();

export const useReception = () => useContext(ReceptionContext);

export const ReceptionProvider = ({ children }) => {
  const [receptionList, setReceptionList] = useState([]);

  return (
    <ReceptionContext.Provider value={{ receptionList, setReceptionList }}>
      {children}
    </ReceptionContext.Provider>
  );
};