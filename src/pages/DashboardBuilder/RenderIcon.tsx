import { SvgIconProps } from '@mui/material';
import { DonutLarge, PieChart, BarChart, Map, Timeline, List } from '@mui/icons-material';

interface Props extends SvgIconProps {
  type: string;
}

const RenderIcon = ({ type, ...iconProps }: Props) => {
  switch (type) {
    case 'Line':
      return <Timeline {...iconProps} />;
    case 'Bar':
      return <BarChart {...iconProps} />;
    case 'Pie':
      return <PieChart {...iconProps} />;
    case 'Doughnut':
      return <DonutLarge {...iconProps} />;
    case 'Table':
      return <List {...iconProps} />;
    case 'Map':
      return <Map {...iconProps} />;

    default:
      return null;
  }
};

export default RenderIcon;
