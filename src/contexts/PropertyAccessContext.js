'use client';
import { createContext, useContext, useMemo } from 'react';

const PropertyAccessContext = createContext(null);

export function PropertyAccessProvider({ access, children }) {
  const value = useMemo(() => access || null, [access]);
  return (
    <PropertyAccessContext.Provider value={value}>
      {children}
    </PropertyAccessContext.Provider>
  );
}

export function usePropertyAccess() {
  return useContext(PropertyAccessContext);
}
