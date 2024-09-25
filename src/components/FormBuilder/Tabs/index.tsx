import { Box, Button, Collapse, IconButton } from '@material-ui/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AddAlertIcon from '@material-ui/icons/AddAlert';
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import PolicyIcon from '@material-ui/icons/Policy';
import SettingIcon from '@material-ui/icons/Settings';
import { useCallback, useContext, useEffect, useState } from 'react';
import ManageTabs from 'src/components/FormBuilder/Tabs/ManageTabs';
import axios, { CancelTokenSource } from 'axios';
import axiosInstance from 'src/axios/axiosInstance';
import { sortBy } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import { MdDragIndicator } from 'react-icons/md';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import Steps from './Steps';
import { resourcePolicy } from 'src/components/FormBuilder/Tabs/helper';
import Setting from 'src/components/FormBuilder/Tabs/Setting';
import Actions from 'src/components/FormBuilder/Tabs/Actions';
import Notifications from 'src/components/FormBuilder/Tabs/Notifications';
import PolicyDialog from 'src/components/FormBuilder/Tabs/policyDialog';
import { AddOutlined, ExpandLess, ExpandMore } from '@material-ui/icons';

const DynamicTabs = ({ resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [open, setOpen] = useState({ open: false, data: null });
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);

  const fetchData = useCallback(
    async (cancelTokenSource?: CancelTokenSource) => {
      setLoading(true);
      axiosInstance()
        .get(`/sa-formbuilder/tabs/${resource}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setResourceData(data);
          setTabs(sortBy(data?.tabs, 'order'));
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    },
    [resource]
  );

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [resource]);

  const handleDelete = (tab) => {
    setDeleting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/delete/${resourceData?._id}`, { tabId: tab?._id })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleUpdateOrder = (tabs) => {
    axiosInstance()
      .put(
        `/sa-formbuilder/tabs/order/${resourceData?._id}`,
        tabs?.map((tab) => ({ tabId: tab?._id, order: tab?.order }))
      )
      .then(() => {
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOnDragEnd = (result: DragEndEvent) => {
    if (!result.over || result.active.id === result.over.id) {
      return;
    }
    const { active, over } = result;
    const overIndex = over.data.current?.index;
    const activeIndex = active.data.current?.index;

    const items: any = Array.from(tabs);
    const [reorderedItem] = items.splice(activeIndex, 1);
    items.splice(overIndex, 0, { ...reorderedItem, order: overIndex });
    const updatedTabs = items.map((i, index) => ({ ...i, order: index }));
    setTabs(updatedTabs);

    handleUpdateOrder(updatedTabs);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event?.active?.data.current.props);
  };

  const sensors = useDndSensors();

  return (
    <Box>
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            setOpen({ open: true, data: null });
          }}
          startIcon={<AddOutlined />}
        >
          Add Tab
        </Button>
        <Box>
          {resourcePolicy.find((e) => e.resource === resource) && (
            <HtmlTooltip title={'Policy'}>
              <IconButton
                aria-label="Policy"
                onClick={() => {
                  setOpenPolicy(true);
                }}
              >
                <PolicyIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Setting'}>
            <IconButton
              aria-label="Setting"
              onClick={() => {
                setOpenSetting(true);
              }}
            >
              <SettingIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Actions'}>
            <IconButton
              aria-label="Actions"
              onClick={() => {
                setOpenAction(true);
              }}
            >
              <BuildIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Notifications'}>
            <IconButton
              aria-label="Notifications"
              onClick={() => {
                setOpenNotifications(true);
              }}
            >
              <AddAlertIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </Box>

      <Box pt={2}>
        <DndContext onDragEnd={handleOnDragEnd} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
          <RenderTabItems {...{ tabs, loading, setOpen, resourceData, setDeleteData, fetchData }} />
          <DragOverlay>
            {activeItem && (
              <span className="[&_.drag-handle]:!cursor-grabbing">
                <SingleTab {...activeItem} />
              </span>
            )}
          </DragOverlay>
        </DndContext>
      </Box>
      <>
        {open?.open && (
          <ManageTabs
            onClose={() => {
              setOpen({ open: false, data: null });
            }}
            data={open?.data}
            onSuccess={() => {
              setOpen({ open: false, data: null });
              fetchData();
            }}
            resource={resource}
            resourceId={resourceData?._id || null}
          />
        )}

        {deleteData && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete ${deleteData?.tabName}?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleDelete(deleteData)}
            okBtnLoading={isDeleting}
          />
        )}

        {openPolicy && (
          <PolicyDialog
            onClose={() => {
              setOpenPolicy(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenPolicy(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}

        {openSetting && (
          <Setting
            onClose={() => {
              setOpenSetting(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenSetting(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}

        {openAction && (
          <Actions
            onClose={() => {
              setOpenAction(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenAction(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}

        {openNotifications && (
          <Notifications
            onClose={() => {
              setOpenNotifications(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenNotifications(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}
      </>
    </Box>
  );
};

export default DynamicTabs;

const RenderTabItems = ({ tabs, loading, setOpen, resourceData, setDeleteData, fetchData }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {tabs && tabs?.length ? (
        <ul className="grid list-none items-start gap-2">
          <SortableContext items={tabs.map((d) => d._id)}>
            {tabs?.map((tab, index) => {
              return <SingleTab key={tab?._id} {...{ tab, setOpen, resourceData, setDeleteData, fetchData, index }} />;
            })}
          </SortableContext>
        </ul>
      ) : loading ? (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box minHeight={'200px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
          Tabs not added yet!
        </Box>
      )}
    </div>
  );
};

const SingleTab = ({ tab, setOpen, resourceData, setDeleteData, fetchData, index, isExpanded: defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: tab._id,
    data: {
      index,
      props: { tab, setOpen, setDeleteData, index, isExpanded }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <>
      <li ref={setNodeRef} style={style} className={`list-none pb-2`}>
        <div className={` rounded-[5px] [border:1px_solid_var(--common-border-color)] ${isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,white)]'}`} >
          <div className="flex items-center justify-between p-3 ">
            <div className="flex items-center gap-2">
              <IconButton size={'small'} className={`drag-handle !cursor-grab `} {...attributes} {...listeners}>
                <MdDragIndicator size={20} className="text-[var(--primary-text)]" />
              </IconButton>
              <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{tab?.tabName}</h3>
            </div>
            <div className="flex min-w-fit gap-1">
              <HtmlTooltip title={'Edit'}>
                <IconButton
                  size="small"
                  aria-label="Edit"
                  onClick={() => {
                    setOpen({ open: true, data: { _id: tab?._id, tabName: tab?.tabName, stepsStyle: tab?.stepsStyle } });
                  }}
                >
                  <EditIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={'Delete'}>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setDeleteData(tab);
                  }}
                >
                  <DeleteIcon fontSize="small" color={'error'} />
                </IconButton>
              </HtmlTooltip>
              <IconButton size="small" onClick={() => setIsExpanded((prev) => !prev)}>
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </div>
          </div>
          <Collapse in={isExpanded}>
            <div className="p-3 [border-top:1px_solid_var(--common-border-color)]">
              <Steps resourceData={resourceData} tab={tab} fetchData={fetchData} />
            </div>
          </Collapse>
        </div>
      </li>
    </>
  );
};
