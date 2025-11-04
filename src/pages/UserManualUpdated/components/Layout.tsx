import React from 'react';
import { UseUsermanual } from '../types';
import Content from './Content';
import Sidebar from './Sidebar';

const Layout = ({ state }: { state: UseUsermanual }) => {
  return (
    <div className="flex w-full flex-grow">
      <Sidebar state={state} />
      <Content state={state} />
    </div>
  );
};

export default Layout;
