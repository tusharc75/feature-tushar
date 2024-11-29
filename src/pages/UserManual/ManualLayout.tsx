import React from 'react';
import ManualContent from 'src/pages/UserManual/ManualContent';
import ManualSidebar from 'src/pages/UserManual/ManualSidebar';
import { ComponentCommonProps } from 'src/pages/UserManual/type';

const ManualLayout = ({ state }: ComponentCommonProps) => {
  return (
    <div className="flex w-full">
      <ManualSidebar state={state} />
      <ManualContent state={state} />
    </div>
  );
};

export default ManualLayout;
