import { useState, useEffect, useContext, Fragment } from 'react';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { repairOrder, deliveryTicket, sidebarResource, COLOUR_MASTER, REPAIR_ORDER_STATUS, MATERIAL_TYPE } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { MdZoomOutMap } from 'react-icons/md';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { Box, Button, Paper, Typography } from '@material-ui/core';

const customNodeStyles = {
  repairOrder: {
    name: sidebarResource?.repairOrder,
    ...COLOUR_MASTER.purchaseOrder
  },
  productAssets: {
    name: 'Assets',
    ...COLOUR_MASTER.assets
  },
  workOrder: {
    name: sidebarResource?.workOrder,
    ...COLOUR_MASTER.service
  },
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.loadingTicket
  },
  repairOrderClosed: {
    name: `${sidebarResource?.repairOrder} Closed`,
    ...COLOUR_MASTER.closedRepairJob
  }
};

const RepairOrderViews = ({ repairOrderNumber, repairOrderId, repairOrderStatus }) => {
  const toastConfig = useContext(CustomToastContext);

  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, [repairOrderNumber]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const repairOrderData: any = await axiosInstance().get(`${repairOrder.api}/${repairOrderId}/work-order/service`);
      const material = repairOrderData?.data?.data?.material;

      const loadingTicket = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${sidebarResource.repairOrder}&referenceId=${repairOrderId}`
      );
      const allLoadingTicket = loadingTicket?.data?.data || [];

      const serializedAsset = material?.filter((s) => s?.type === MATERIAL_TYPE.serializedAsset)?.map((material) => material.serializedAssetDetail);
      const workOrders =
        material?.filter((s) => s?.type === MATERIAL_TYPE.serializedAsset && s?.workOrder)?.map((material) => material?.workOrder) || [];

      var xPosition = 0;
      var flow: any[] = [
        {
          id: repairOrderId,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'repairOrder',
            ref_id: repairOrderId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{sidebarResource?.repairOrder}</Typography>
                <Typography variant="subtitle2">{repairOrderNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.repairOrder
        }
      ];
      var flowEdge: any[] = [];
      if (material?.length) xPosition = xPosition + 300;
      serializedAsset?.map((asset, index) => {
        flow.push({
          id: `${asset._id}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'asset',
            ref_id: asset._id,
            label: (
              <HtmlTooltip arrow placement="top" title={`Asset`}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2">{'Asset'}</Typography>
                  <Typography variant="subtitle2">{asset?.assetNumber}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 70 * index },
          style: customNodeStyles.productAssets
        });
        flowEdge.push({
          id: `${asset?._id}__${repairOrderId}_edge`,
          source: `${repairOrderId}`,
          target: `${asset?._id}`,
          arrowHeadType: 'arrow'
        });
      });

      if (workOrders.length > 0) xPosition += 300;
      const allWorkOrders = [];
      workOrders?.map((workOrder, index) => {
        allWorkOrders.push(`${workOrder._id}`);
        flow.push({
          id: `${workOrder._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'workorder',
            ref_id: workOrder?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={'Work Order'}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2">{workOrder.status || ''}</Typography>
                  <Typography variant="subtitle2">{workOrder.workOrderNumber || ''}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: index * 80 },
          style: customNodeStyles.workOrder
        });
        flowEdge.push({
          id: `workOrder-service-${workOrder?.serializedAsset}-${workOrder._id}`,
          source: `${workOrder?.serializedAsset}`,
          arrowHeadType: 'arrow',
          target: `${workOrder._id}`
        });
      });

      if (allLoadingTicket.length && material.length) xPosition += 300;
      allLoadingTicket?.map((loadingTicket, index) => {
        index++;
        flow.push({
          id: `${loadingTicket._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'loadingTicket',
            ref_id: loadingTicket._id,
            label: (
              <HtmlTooltip arrow placement="top" title={'Loading Ticket'}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2">{'Loading Ticket'}</Typography>
                  <Typography variant="subtitle2">{loadingTicket.ticketName}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: index * 100 },
          style: customNodeStyles.loadingTicket
        });
        loadingTicket?.assets?.map((ele) => {
          const workOrder = workOrders?.find((e) => e.serializedAsset === ele.asset);
          const index = allWorkOrders?.indexOf(workOrder?._id);
          if (index > -1) {
            allWorkOrders?.splice(index, 1);
          }
          flowEdge.push({
            id: `asset-loading-${ele.asset}-${loadingTicket._id}`,
            source: workOrder?._id,
            target: loadingTicket._id,
            arrowHeadType: 'arrow'
          });
        });
      });

      if (repairOrderStatus === REPAIR_ORDER_STATUS.completed) {
        xPosition += 300;
        flow.push({
          id: `${repairOrderId}-closed`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'repairJob',
            ref_id: repairOrderId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{sidebarResource?.repairOrder}</Typography>
                <Typography variant="subtitle2">{repairOrderNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.repairOrderClosed
        });
        allWorkOrders?.map((woId) => {
          flowEdge.push({
            id: `repairOrder-closed-${woId}-${repairOrderId}`,
            source: woId,
            target: `${repairOrderId}-closed`,
            arrowHeadType: 'arrow'
          });
        });
        allLoadingTicket?.map((loadingTicket) => {
          flowEdge.push({
            id: `repairOrder-closed-${loadingTicket._id}-${repairOrderId}`,
            source: loadingTicket._id,
            target: `${repairOrderId}-closed`,
            arrowHeadType: 'arrow'
          });
        });
      }

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastConfig.setToastConfig(err);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'asset':
        window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'workorder':
        window.open(`${routes?.workOrderDetail?.path}/${element.data.ref_id}`);
        break;
      case 'loadingTicket':
        window.open(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullScreenOpen} setFullScreen={false}>
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
      <div style={fullScreenOpen ? { height: '95vh' } : { height: '68vh' }}>
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
                    <ControlButton onClick={() => (fullScreenOpen ? setFullScreenOpen(false) : setFullScreenOpen(true))}>
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
};
export default RepairOrderViews;
