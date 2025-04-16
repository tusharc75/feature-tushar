import { Box, IconButton, useMediaQuery } from '@mui/material';
import React, { memo, useContext, useEffect, useState } from 'react';
import { FiSidebar } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import DesktopRoadmap from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import MobileRoadmap from './MobileRoadmap';
import ServiceAssignDialog from 'src/pages/TechnicianScheduler/Roadmap/ServiceAssignDialog';
import IconButtonTabs from 'src/components/IconButtonTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RefreshIcon from '@mui/icons-material/Refresh';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import StartStopDateDialog from 'src/pages/FieldTicket/material/StartStopDateDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export type HandleSelect = (event: React.SyntheticEvent, data: TActivity | string[], type: 'technician' | 'map' | '') => void;

function Roadmap({
  filter,
  selectedRecords,
  handleUnAssignTechnician,
  leftSidebar = null,
  selectedResource = null,
  headerSlot = null,
  refreshRoadMap,
  handleSucess,
  setViewType,
  viewType,
  refreshAll
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activity, setActivity] = useState(null);
  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState<string[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [assignServiceDialog, setAssignServiceDialog] = useState({ open: false, data: null });
  const [startEndDateConfermationDialog, setStartEndDateConfermationDialog] = useState({
    open: false,
    type: null,
    referenceId: null,
    minDateTime: null,
    notes: '',
    _id: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    filter.view === 'Technician View' && fetchRoadmap();
  }, [filter.view, refreshRoadMap, selectedResource]);

  const fetchRoadmap = async () => {
    await axiosInstance().get(`/technician-scheduler/get-schedule?resource=${selectedResource.resource}`)
      .then(({ data: { data } }) => {
        setActivity(data);
      });
  };

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data, type) => {
    if (type === 'map') {
      setSelected(data);
    } else if (type === 'assign') {
      setAssignServiceDialog({ open: true, data: data });
    } else if (type === 'un-assign') {
      handleUnAssignTechnician(data);
    } else if (type === 'dispatch') {
      setStartEndDateConfermationDialog({ open: true, type: 'start', referenceId: data?.referenceId, minDateTime: null, notes: '', _id: data?._id });
    } else if (type === 'return') {
      setStartEndDateConfermationDialog({ open: true, type: 'stop', referenceId: data?.referenceId, minDateTime: data?.startDate, notes: data?.notes, _id: data?._id });
    }
  };

  const handleUpdateStartEndDate = (values) => {
    let value: any = {
      type: startEndDateConfermationDialog.type,
      referenceId: startEndDateConfermationDialog.referenceId,
      _id: [startEndDateConfermationDialog._id]
    };
    if (startEndDateConfermationDialog.type !== 'stop') {
      value.startDate = values?.startDate;
    } else {
      value.endDate = values?.endDate;
    }
    if (values?.notes) value.notes = values?.notes;
    setIsSubmitting(true);
    axiosInstance().put(`${selectedResource.api}/technician/start-end-date`, value).then(({ data }) => {
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
      setStartEndDateConfermationDialog({ open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null });
      fetchRoadmap()
      setIsSubmitting(false)
    }).catch((error) => {
      setIsSubmitting(false)
      toastConfig.setToastConfig(error);
    });
  };

  return (
    <>
      {headerSlot && (
        <div className="mb-4 flex items-center gap-2">
          <ToggleSidebar leftSidebar={leftSidebar} setIsSidebarOpen={setIsSidebarOpen} />
          {headerSlot}
          <div className="ml-auto flex gap-1">
            <IconButtonTabs
              items={
                [
                  {
                    value: 'job',
                    icon: <FormatListBulletedIcon />,
                    tooltip: 'Job View'
                  },
                  {
                    value: 'service',
                    icon: <FormatListBulletedIcon />,
                    tooltip: 'Service View'
                  }
                ] as const
              }
              setValue={setViewType}
              value={viewType}
            />
            <HtmlTooltip title={'Refresh'}>
              <IconButton size="small" onClick={refreshAll}>
                <RefreshIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          </div>
        </div>
      )}
      <Box bgcolor="var(--dark-secondary, white)">
        {isMobile ? (
          <MobileRoadmap
            activity={activity}
            expanded={expanded}
            leftSidebar={leftSidebar}
            selected={selected}
            handleToggle={handleToggle}
            handleSelect={handleSelect}
            setSelected={setSelected}
            loading={!activity}
          />
        ) : (
          <DesktopRoadmap
            loading={!activity}
            selectedResource={selectedResource}
            activity={activity}
            leftSidebar={leftSidebar}
            handleSelect={handleSelect}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            selected={selected}
            setSelected={setSelected}
          />
        )}
      </Box>
      {assignServiceDialog.open && (
        <ServiceAssignDialog
          handleClose={() => {
            setAssignServiceDialog({ open: false, data: null });
          }}
          selectedResource={selectedResource}
          technician={assignServiceDialog.data}
          handleSucess={() => {
            handleSucess();
            fetchRoadmap();
            setAssignServiceDialog({ open: false, data: null });
          }}
          viewType={viewType}
        />
      )}

      {startEndDateConfermationDialog.open && (
        <StartStopDateDialog
          type={startEndDateConfermationDialog.type}
          resource={selectedResource.resource}
          onClose={() => {
            setStartEndDateConfermationDialog({ open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null });
          }}
          handleSubmit={(value) => {
            handleUpdateStartEndDate(value);
          }}
          loading={isSubmitting}
          minStartDateTime={startEndDateConfermationDialog.minDateTime}
          notes={startEndDateConfermationDialog.notes}
        />
      )}
    </>
  );
}

export default Roadmap;

const ToggleSidebar = memo(
  ({ leftSidebar, setIsSidebarOpen }: { leftSidebar: React.ReactNode; setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    if (!leftSidebar) return null;
    return (
      <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)}>
        <FiSidebar />
      </IconButton>
    );
  }
);
