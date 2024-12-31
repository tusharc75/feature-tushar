import React from 'react';

import Tab, { TabProps } from '@mui/material/Tab';
import Tabs, { TabsProps } from '@mui/material/Tabs';

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {value === index ? children : null}
    </div>
  );
};

type CustomTabInterface = Omit<TabsProps, 'TabIndicatorProps' | 'TabIndicatorProps' | 'onChange'> & {
  onChange?: (event: React.ChangeEvent<{}>, newValue: number | string) => void;
};
const CustomTabs: React.FC<CustomTabInterface> = ({ children, className = '', ...others }) => {
  return (
    <Tabs
      {...others}
      className={`new-tab-container-v1 ${className}`}
      textColor={'primary'}
      TabIndicatorProps={{
        style: {
          display: 'none'
        }
      }}
    >
      {children}
    </Tabs>
  );
};

interface CustomTabProps extends TabProps {
  children?: React.ReactNode | string;
  value: number;
  primaryColor?: boolean;
}
const CustomTab: React.FC<CustomTabProps> = ({ children, label, className = '', value = 0, primaryColor = false, ...props }) => {
  return (
    <Tab
      label={
        <div className="tab-font" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children || label}
        </div>
      }
      value={value}
      className={`tabLayout ${className} ${primaryColor ? 'primaryColoredTab' : ''}`}
      id={`main-tab-${value}`}
      aria-controls={`main-tabpanel-${value}`}
      {...props}
    />
  );
};

export default CustomTabs;

export { CustomTab, TabPanel };
