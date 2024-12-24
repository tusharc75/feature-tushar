import { Box, Button } from '@mui/material';
import { Fragment, useState } from 'react';
import { generateUniqueId } from '../../constants/helpers';
import OrgChart from './OrgChart';
import './OrgChartContainer.scss';

export default function OrgChartContainer({ data, onClick, updateChart = null, setShowAddContact = null, isInContact = false }) {
  const chartId = `chart-${generateUniqueId()}`;
  const google = window.google;
  google.charts.load('current', { packages: ['orgchart'] });

  const [positions, setPositions] = useState([]);

  const getOrgChart = async () => {
    setPositions([...data]);
  };

  const onClickNode = (id) => {
    onClick(id);
  };

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="custom-orgchart mx-auto">
        <OrgChart
          positions={positions}
          getOrgChart={getOrgChart}
          chartId={chartId}
          updateChart={updateChart}
          onClickNode={onClickNode}
          google={google}
        />
      </div>
      {isInContact && (
        <div>
          <Button size="small" variant="contained" onClick={setShowAddContact} color="primary">
            Add Contacts
          </Button>
        </div>
      )}
    </div>
  );
}
