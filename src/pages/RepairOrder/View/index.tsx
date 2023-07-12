import { useState, useEffect, useContext, Fragment } from 'react';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { repairOrder, deliveryTicket, sidebarResource, COLOUR_MASTER, REPAIR_ORDER_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { MdZoomOutMap } from 'react-icons/md';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import _, { capitalize } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

const customNodeStyles = {
  repairOrder: {
    name: 'RepairOrder',
    background: '#E2F8FF',
    borderColor: '#8BCBDF'
  },
  workOrder: { name: 'WorkOrder', ...COLOUR_MASTER.repairJob },
  repairOrderClosed: {
    name: 'RepairOrder Closed',
    ...COLOUR_MASTER.repairJob
  },
  productAssets: {
    name: 'Assets',
    ...COLOUR_MASTER.assets
  },
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.loadingTicket
  }
};

const RepairOrderViews = (props) => {
  const { repairOrderNumber, repairOrderId, repairOrderStatus } = props;

  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchViewsData();
  }, [repairOrderNumber]);

  async function fetchViewsData() {
    setLoading(true);
    try {
      const repairOrderData: any = await axiosInstance().get(`${repairOrder.api}/${repairOrderId}/work-order/service`);
      const loadingTicket = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${sidebarResource.repairOrder}&referenceId=${repairOrderId}`
      );
      const allAssets = repairOrderData?.data?.data?.material;
      const serializedAssetDetails = allAssets?.filter((s) => s?.type === 'serializedAsset')?.map((material) => material.serializedAssetDetail);
      const workOrders = allAssets?.filter((s) => s?.type === 'serializedAsset' && s?.workOrder)?.map((material) => material?.workOrder) || [];
      const allLoadingTicket = loadingTicket?.data?.data || [];
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
              <div>
                <Typography variant="body2">{routes.repairOrder.title}</Typography>
                <Typography style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} variant="subtitle2">
                  {repairOrderNumber}
                </Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.repairOrder
        }
      ];
      var flowEdge: any[] = [];
      if (allAssets?.length) xPosition = xPosition + 300;
      serializedAssetDetails?.map((asset, index) => {
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
                <div>
                  <Typography style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} variant="body2">
                    {asset?.assetNumber}
                  </Typography>
                  <Typography variant="subtitle2">{'Asset'}</Typography>
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
      workOrders?.map((workOrder, index) => {
        flow.push({
          id: `${workOrder._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'workorder',
            ref_id: workOrder?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={'Workorder'}>
                <div>
                  <Typography style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} variant="body2">
                    {workOrder.workOrderNumber || ''}
                  </Typography>
                  <Typography variant="subtitle2">{workOrder.status || ''}</Typography>
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

      if (allLoadingTicket.length && allAssets.length) xPosition += 300;
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
                <div>
                  <Typography style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} variant="body2">
                    {loadingTicket.ticketName}
                  </Typography>
                  <Typography variant="subtitle2">{'Loading Ticket'}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: index * 100 },
          style: customNodeStyles.loadingTicket
        });
        loadingTicket?.productInventory?.map((productInventory) => {
          flowEdge.push({
            id: `asset-loading-${productInventory.optionValue}-${loadingTicket._id}`,
            source: productInventory.optionValue,
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
              <div>
                <Typography style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} variant="body2">
                  {repairOrderNumber}
                </Typography>
                <Typography variant="subtitle2">{routes.repairOrder.title}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.repairOrderClosed
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
  }

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'workorder':
        history.push(`${routes.workOrderDetail.path}/${element.data.ref_id}`);
        break;
      case 'loadingTicket':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen title="Views" fullScreen={fullScreenOpen} setFullScreen={false} isheader={false}>
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
