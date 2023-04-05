import { Box, Button, Paper } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { COLOUR_MASTER } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';

const customNodeStyles = {
  serviceOrder: {
    name: 'Service Order',
    ...COLOUR_MASTER.purchaseOrder
  },
  serviceOrderClosed: {
    name: 'Service Order Closed',
    ...COLOUR_MASTER.purchaseOrder
  },
  service: {
    name: 'Service',
    ...COLOUR_MASTER.product
  },
  technician: {
    name: 'Technician',
    ...COLOUR_MASTER.assets
  }
};

function ServiceOrderViews({ serviceData }) {
  const toastConfig = useContext(CustomToastContext);
  const [colorInfo, setColorInfo] = useState(false);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [serviceData._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      var xPosition = 0;
      const services = await axiosInstance().get(`service-order/${serviceData?._id}/material`);
      const technicians = await axiosInstance().get(`service-order/${serviceData?._id}/technician`);
      const allServices = services?.data?.data?.material;
      const allTechnician = technicians?.data?.data;
      const serviceIdMaterial = {};
      const availableTechnician = {};
      var flow: any[] = [
        {
          id: `${serviceData?._id}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'serviceOrder',
            ref_id: serviceData?._id,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{serviceData?.serviceOrderNumber || ''}</div>
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.serviceOrder
        }
      ];
      var flowEdge: any[] = [];
      if (allServices?.length) xPosition = xPosition + 300;
      allServices?.map((service, index) => {
        serviceIdMaterial[service?.materialId] = service._id;
        flow.push({
          id: `${service._id}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'purchaseOrder',
            ref_id: service._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {service?.serviceDetail?.serviceName || service?.packageDetail?.packageName || service?.productDetail?.productName || ''}
              </div>
            )
          },
          position: { x: xPosition, y: 80 * index },
          style: customNodeStyles.service
        });
        flowEdge.push({
          id: `${service?._id}__${serviceData?._id}_edge`,
          source: `${serviceData?._id}`,
          target: `${service?._id}`
        });
      });

      if (allTechnician?.length) xPosition = xPosition + 300;
      allTechnician?.map((technician, index) => {
        availableTechnician[technician?.service?.optionValue] = true;
        flow.push({
          id: `${technician?.technician?._id}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'technician',
            ref_id: technician?.technician?._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{technician?.technician?.employeeNumber || ''}</div>
            )
          },
          position: { x: xPosition, y: 80 * index },
          style: customNodeStyles.technician
        });
        flowEdge.push({
          id: `${technician?.service?.optionValue}__${technician?.technician?._id}_edge`,
          source: `${serviceIdMaterial[technician?.service?.optionValue]}`,
          target: `${technician?.technician?._id}`
        });
      });

      xPosition += 300;
      flow.push({
        id: `${serviceData?._id}_Closed`,
        type: 'output',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: 'received',
          ref_id: serviceData?._id,
          label: (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{serviceData?.serviceOrderNumber || ''} Closed</div>
          )
        },
        position: { x: xPosition, y: 80 },
        style: customNodeStyles.serviceOrderClosed
      });
      allServices?.map((service, index) => {
        if (!availableTechnician[service?.materialId]) {
          flowEdge.push({
            id: `${service?._id}__${serviceData?._id}_edge`,
            source: `${service?._id}`,
            target: `${serviceData?._id}_Closed`
          });
        }
      });
      allTechnician?.map((technician, index) => {
        flowEdge.push({
          id: `${technician?.technician?._id}__${serviceData?._id}_edge`,
          source: `${technician?.technician?._id}`,
          target: `${serviceData?._id}_Closed`
        });
      });

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastConfig.setToastConfig(err);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'purchaseOrder':
        break;
    }
  };

  return (
    <ContentFullScreen title="Views" fullScreen={fullDialogueOpen} setFullScreen={false} isheader={false}>
      <Box marginLeft={2} marginTop={1} display="flex" flexDirection="column">
        <Box>
          <Button
            variant={'outlined'}
            color="default"
            size="small"
            onClick={() => {
              setColorInfo(!colorInfo);
            }}
            aria-controls="action-menu"
            endIcon={colorInfo ? <ExpandLess /> : <ExpandMore />}
          >
            {'Color Info'}
          </Button>
        </Box>
        {colorInfo && (
          <Box>
            <div style={{ marginLeft: 'auto', marginRight: 'auto', position: 'absolute', zIndex: 9999 }}>
              <Paper elevation={3} variant="outlined">
                <Box display="flex" flexDirection="column">
                  {Object.keys(customNodeStyles).map((key) => {
                    return (
                      <Box p={1}>
                        <div
                          style={{
                            display: 'inline-flex',
                            height: '12px',
                            width: '12px',
                            marginRight: '5px',
                            borderRadius: '100%',
                            background: `${customNodeStyles[key].background}`,
                            borderColor: `1px solid ${customNodeStyles[key].borderColor}`
                          }}
                        ></div>
                        {customNodeStyles[key].name}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </div>
          </Box>
        )}
      </Box>
      <div style={fullDialogueOpen ? { height: '92vh' } : { height: '65vh' }}>
        {!loading ? (
          flowData.length ? (
            <Fragment>
              <ReactFlowProvider>
                <ReactFlow
                  elements={flowData || []}
                  onLoad={onLoad}
                  selectNodesOnDrag={false}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  onElementClick={onElementClick}
                >
                  <Controls>
                    <ControlButton onClick={() => (fullDialogueOpen ? setFullDialogueOpen(false) : setFullDialogueOpen(true))}>
                      <MdZoomOutMap />
                    </ControlButton>
                  </Controls>
                </ReactFlow>
              </ReactFlowProvider>
            </Fragment>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 w-100">No Data to Show.</div>
          )
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 w-100">Loading Views...</div>
        )}
      </div>
    </ContentFullScreen>
  );
}

export default ServiceOrderViews;
