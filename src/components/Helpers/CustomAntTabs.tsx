import { Theme, createStyles } from '@mui/material/styles';
import { Typography, Tabs, Tab } from '@mui/material';
import { DeveloperBoard, Map } from '@mui/icons-material';
import { withStyles } from '@mui/styles';

const AntTabs = withStyles((theme: Theme) => ({
  root: {
    minHeight: '38px'
    // borderBottom: "1px solid #e8e8e8",
  },
  indicator: {
    backgroundColor: theme.palette.primary.main, //  dargBg
    display: 'none'
  },
  '&.Component-root.Component-selected': {
    color: 'red !important'
  }
}))(Tabs);

const AntTab = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      minWidth: 72,
      fontWeight: 600,
      marginRight: theme.spacing(4),

      '&:hover': {
        color: 'var(--secondary)', //  dargBg
        opacity: 1
      },
      '&$selected': {
        color: theme.palette.primary.main, //  dargBg
        fontWeight: theme.typography.fontWeightMedium,
        pointerEvents: 'none'
      },
      '&:focus': {
        color: theme.palette.primary.main //  darkBg
      }
    },
    selected: {
      color: '#43AEAA !important'
    }
  })
)((props: StyledTabProps) => <Tab className="AntTab" icon={props.label === 'Board' ? <DeveloperBoard /> : <Map />} disableRipple {...props} />);

interface StyledTabProps {
  label: string;
}

const CustomAntTabs = ({ value, setValue, tabs }) => {
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div>
      <AntTabs value={value} onChange={handleTabChange} aria-label="ant example">
        {tabs.map((tab, i) => (
          <AntTab key={i} label={tab} />
        ))}
      </AntTabs>
      <Typography />
    </div>
  );
};

export default CustomAntTabs;
