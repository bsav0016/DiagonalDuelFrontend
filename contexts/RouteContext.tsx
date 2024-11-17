import React, { createContext, useContext } from 'react';
import { useRouter } from 'expo-router';
import { Routes } from '@/enums/Routes';

const RouteContext = createContext({
  routeTo: (route: Routes) => {},
});

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const routeTo = (route: Routes) => {
    const routeString = `/${route}`;
    router.push(routeString as import('expo-router').RelativePathString);
  };

  return (
    <RouteContext.Provider value={{ routeTo }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteTo = () => useContext(RouteContext);
