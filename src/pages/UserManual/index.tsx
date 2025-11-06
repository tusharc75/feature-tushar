import React from 'react';
import { UsermanualProvider } from 'src/pages/UserManual/hooks/useUsermanual';
import { useUsermanual } from './hooks/useUsermanual';
import NavBar from './components/Navbar';
import Layout from './components/Layout';

const UserManualImpl = () => {
  const state = useUsermanual();
  return (
    <div className="flex min-h-screen w-full flex-col [--manual-head-height:60px] [--manual-sidebar-width:300px] dark:bg-[black]">
      <NavBar state={state} />
      <Layout state={state} />
    </div>
  );
};

const UserManual = () => (
  <UsermanualProvider>
    <UserManualImpl />
  </UsermanualProvider>
);
export default UserManual;
