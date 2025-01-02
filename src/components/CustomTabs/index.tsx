import React from 'react';

import Tab, { TabProps } from '@mui/material/Tab';
import Tabs, { TabsProps } from '@mui/material/Tabs';
import { cn } from 'src/constants/helpers';

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

type CustomTabInterface = {
  onChange?: (event: React.ChangeEvent<{}>, newValue: number | string) => void;
} & Omit<TabsProps, 'TabIndicatorProps' | 'TabIndicatorProps' | 'onChange'>;
const CustomTabs: React.FC<CustomTabInterface> = ({ children, className = '', ...others }) => {
  const borderColor = children?.[0].props?.primaryColor
    ? '[--tab-border-color:var(--primary-color)] dark:[--tab-border-color:var(--common-border-color)]'
    : '[--tab-border-color:var(--common-border-color)]';
  return (
    <Tabs
      {...others}
      className={cn(`new-tab-container-v1 `, className, borderColor)}
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

type CustomTabProps = {
  children?: React.ReactNode;
  value: number;
  primaryColor?: boolean;
} & Omit<TabProps, 'children'>;

const CustomTab: React.FC<CustomTabProps> = ({ children, label, className = '', value = 0, primaryColor = false, ...props }) => {
  return (
    <Tab
      label={
        <div className="tab-font" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children || label}
        </div>
      }
      sx={{
        borderTop: `1px solid var(--tab-border-color)`,
        borderRight: `1px solid var(--tab-border-color)`,
        '&:first-child': {
          borderLeft: `1px solid var(--tab-border-color)`
        }
      }}
      value={value}
      className={cn(`tabLayout`, className, primaryColor ? 'primaryColoredTab' : '')}
      id={`main-tab-${value}`}
      aria-controls={`main-tabpanel-${value}`}
      {...props}
    />
  );
};

export default CustomTabs;

export { CustomTab, TabPanel };
