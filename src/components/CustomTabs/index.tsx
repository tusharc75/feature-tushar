import React from 'react';

import Tabs, { TabsProps } from '@material-ui/core/Tabs';
import Tab, { TabProps } from '@material-ui/core/Tab';

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
};

type CustomTabInterface = Omit<TabsProps, 'TabIndicatorProps' | 'TabIndicatorProps' | 'onChange'> & {
  onChange?: (event: React.ChangeEvent<{}>, newValue: number) => void;
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
  index: number;
}
const CustomTab: React.FC<CustomTabProps> = ({ children, className = '', index = 0, ...props }) => {
  return (
    <Tab
      label={<div className="tab-font">{children}</div>}
      className={`tabLayout ${className}`}
      aria-controls={`main-tabpanel-${index}`}
      {...props}
    />
  );
};

export default CustomTabs;

export { CustomTab, TabPanel };
