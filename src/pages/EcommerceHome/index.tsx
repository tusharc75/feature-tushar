import { Box, Button, CircularProgress } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { MobileExportIcon, MobileImportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { addItemAtIndex, changeItemIndex } from 'src/constants/helpers';
import { v4 as uuid } from 'uuid';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import DropContainer, { SingleSection } from './DropContainer';
import Sidebar, { SidebarItem } from './Sidebar';
import { useDndSensors } from 'src/hooks';
import { useData } from 'src/StateProvider/Provider';

const useClasses = makeStyles(() => ({
  root: {
    height: 'calc(80vh + 20px)'
  },
  gridBox_layout: {
    height: 'calc(85vh-194px)',
    overflow: 'auto'
  },
  column: {
    flexDirection: 'row'
  },
  screenHeightAuto: {
    height: 'calc(100vh - 200px)',
    overflow: 'auto'
  }
}));

const EcommerceHome = () => {
  const classes = useClasses();
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [activeSection, setActiveSection] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState(null);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get('/e-commerce-home')
      .then(({ data: { data } }) => {
        let items = data?.items?.sort((a, b) => a.order - b.order);
        setFormData(items || []);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleClickSave = () => {
    setIsSubmitting(true);
    let body = {
      items:
        formData?.map((i, idx) => {
          return {
            ...i,
            order: idx + 1
          };
        }) || []
    };
    axiosInstance()
      .put('/e-commerce-home', body)
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleRemove = (id: string) => {
    setFormData((prevState) => prevState.filter((i) => (i._id ? i._id !== id : i.name !== id)));
  };

  const handleImport = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Uploading file, Please wait...`
      });
      const file_to_read = event.target.files[0];
      const fileread = new FileReader();
      fileread.onload = function (e) {
        const content: any = e.target.result;
        const data = JSON.parse(content);
        setFormData(data);
      };
      fileread.readAsText(file_to_read);
      event.target.files = null;
      event.target.value = '';
    }
  };

  const handleExportField = () => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Your file will be downloaded/uploaded in a matter of seconds`
    });
    const url = window.URL.createObjectURL(new Blob([JSON.stringify(formData) || '']));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `page_structure.json`);
    document.body.appendChild(link);
    link.click();
  };

  const sensors = useDndSensors();

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    const activeElementType = event.active.data?.current?.type;
    const activeElementProps = event.active.data?.current?.props;

    if (activeElementType === 'SidebarItem') {
      setActiveSidebarItem(activeElementProps);
    }
    if (activeElementType === 'Section') {
      setActiveSection(activeElementProps);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveSidebarItem(null);
    setActiveSection(null);
    if (!event.over) return;
    const { active, over } = event;
    if (active.id === over.id) return;
    const activeItemType = active.data.current?.type;
    const overItemType = over.data.current?.type;
    let newFormData = [...formData];

    if (activeItemType === 'SidebarItem') {
      let draggedItem = active.data.current.props.item;
      draggedItem = { ...draggedItem, _id: uuid() };
      if (overItemType === 'EmptySection') {
        newFormData.push(draggedItem);
        setFormData(newFormData);
      }
      if (overItemType === 'Section') {
        const overIndex = over.data.current.index;
        setFormData(addItemAtIndex(newFormData, draggedItem, overIndex));
      }
    }
    if (activeItemType === 'Section' && overItemType === 'Section') {
      const draggedItem = active.data.current.props.itemData;
      const activeIndex = active.data.current.index;
      const overIndex = over.data.current.index;
      setFormData(changeItemIndex(newFormData, draggedItem, activeIndex, overIndex));
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.eCommerceHome?.titlePlural }]} />
        </Box>
        <Box className="controls-v1">
          <Box sx={{ display: 'flex' }}>
            <label
              className={`new-headerbox-button-v1 ${isMobile && !isTablet ? 'h-[26px] w-[26px] p-1' : ''}`}
              onClick={handleExportField}
              style={{ cursor: 'pointer' }}
            >
              {isMobile && !isTablet ? <MobileExportIcon size={18} color={'var(--primary-text)'} /> : 'Export'}
            </label>
            <input
              onClick={(e: any) => (e.target.value = null)}
              accept="application/json"
              style={{
                opacity: '0',
                position: 'absolute',
                zIndex: -1
              }}
              onChange={handleImport}
              id="import-file"
              multiple={false}
              type="file"
            />
            <label
              htmlFor="import-file"
              className={`new-headerbox-button-v1 ${isMobile && !isTablet ? 'h-[26px] w-[26px] p-1' : ''}`}
              style={{ marginRight: '8px', cursor: 'pointer' }}
            >
              {isMobile && !isTablet ? <MobileImportIcon size={18} color={'var(--primary-text)'} /> : 'Import'}
            </label>

            <Button
              color="primary"
              variant="contained"
              size="small"
              disabled={isSubmitting || loading}
              onClick={handleClickSave}
              startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
            <Sidebar />
            <div className="container-with-border p-4">
              {loading ? (
                <Box height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                  <CircularProgress size={30} color="inherit" />
                </Box>
              ) : (
                <DropContainer formData={formData} setFormData={setFormData} handleRemove={handleRemove} />
              )}
            </div>
          </div>
          <span className=" [&_.drag-handle]:!cursor-grabbing">
            <DragOverlay dropAnimation={null}>{activeSidebarItem && <SidebarItem {...activeSidebarItem} />}</DragOverlay>
            <DragOverlay>{activeSection && <SingleSection {...activeSection} />}</DragOverlay>
          </span>
        </DndContext>
      </Box>
    </Box>
  );
};

export default EcommerceHome;
