import React, { useState, useEffect, useContext, Fragment } from 'react';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { deliveryTicket, DELIVERY_TICKET_REFERENCE_TYPE, ASSET_STATUS, REPAIR_JOB_STATUS, COLOUR_MASTER } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { MdZoomOutMap } from 'react-icons/md';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { Box, Button, Paper, Typography } from '@mui/material';

const customNodeStyles = {
  repairJob: {
    name: 'Repair Job',
    ...COLOUR_MASTER.purchaseOrder
  },
  asset: {
    name: 'Assets',
    ...COLOUR_MASTER.assets,
    cursor: 'pointer'
  },
  lostAssets: {
    name: 'Lost Assets',
    ...COLOUR_MASTER.lostAssets
  },
  scrapAssets: {
    name: 'Scrap Assets',
    ...COLOUR_MASTER.scrapAssets
  },
  loadingTicket: {
    name: 'Delivery Ticket',
    ...COLOUR_MASTER.deliveredLoadingTicket
  },
  closedRepairJob: {
    name: 'Completed Repair Job',
    ...COLOUR_MASTER.closedRepairJob
  }
};

const customDeliveredNodeStyle = {
  loadingTicket: {
    name: 'Delivery Ticket',
    ...COLOUR_MASTER.deliveredLoadingTicket,
    borderLeft: '10px solid #008000'
  }
};

const RepairJobViews = (props) => {
  const { repairJobName, repairId, repairStatus } = props;

  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchViewsData();
  }, [repairJobName]);

  async function fetchViewsData() {
    setLoading(true);
    try {
      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${repairId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'repairJob',
            ref_id: repairId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.repairJob.name}</Typography>
                <Typography variant="subtitle2">{repairJobName ?? repairJobName}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.repairJob
        }
      ];
      var flowEdge: any[] = [];

      const assets = await axiosInstance().get(`repair-job/${repairId}/assets`);
      const tickets = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.repairJob}&referenceId=${repairId}`
      );

      if (assets?.data?.data?.length) xPosition += 300;
      assets?.data?.data?.map((item, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'asset',
            ref_id: item.inventory,
            label: (
              <HtmlTooltip arrow placement="top" title={item?.status}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2">{customNodeStyles.asset.name}</Typography>
                  <Typography variant="subtitle2">{item.assetNumber}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: index * 80 },
          style:
            item?.status === ASSET_STATUS.scrap || item?.status === ASSET_STATUS.lost
              ? item?.status === ASSET_STATUS.scrap
                ? customNodeStyles.scrapAssets
                : customNodeStyles.lostAssets
              : customNodeStyles.asset
        });

        flowEdge.push({
          id: `edge-assets-${item._id}`,
          source: `${repairId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });

      const allTicketsAssets = assets?.data?.data?.map((asset) => {
        var assetsTicket = [];
        tickets?.data?.data?.map((t) => {
          const ticketInventory = t?.assets?.map((i) => i.asset);
          if (ticketInventory.includes(asset.inventory)) {
            const ticketData = {
              ticketId: t._id,
              ticketName: t.ticketName,
              ticketType: t.ticketType,
              inventory: asset.inventory,
              deliveryTo: t.deliveryTo?.optionLabel,
              pickupFrom: t.pickupFrom?.optionLabel,
              status: t.status
            };
            assetsTicket.push(ticketData);
          }
        });
        return assetsTicket;
      });

      var edgeFromTicketToClosed = [];
      allTicketsAssets?.map((i, index) => {
        i?.map((item, idx) => {
          flow.push({
            id: `${item.ticketId}-${index}-${idx}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'deliveryTicket',
              ref_id: item.ticketId,
              label: (
                <HtmlTooltip
                  arrow
                  placement="top"
                  title={
                    <>
                      <p>
                        <Typography variant="body2">From:</Typography>
                        <Typography variant="subtitle2">{item?.pickupFrom}</Typography>
                      </p>
                      <p>
                        <Typography variant="body2">To:</Typography>
                        <Typography variant="subtitle2">{item?.deliveryTo}</Typography>
                      </p>
                    </>
                  }
                >
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2">{item.ticketType} Ticket</Typography>
                    <Typography variant="subtitle2">{item.ticketName}</Typography>
                  </div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition + (idx + 1) * 300, y: index * 80 },
            style: item.status === 'Delivered' ? customDeliveredNodeStyle.loadingTicket : customNodeStyles.loadingTicket
          });
          flowEdge.push({
            id: `edge-asset-${item.inventory}-${item.ticketId}-${index}-${idx}`,
            source: idx === 0 ? `${item.inventory}` : `${i[idx - 1].ticketId}-${index}-${idx - 1}`,
            arrowHeadType: 'arrow',
            target: `${item.ticketId}-${index}-${idx}`
          });
        });
        if (i.length) {
          const data = { target: `${i[i.length - 1].ticketId}-${index}-${i.length - 1}` };
          edgeFromTicketToClosed.push(data);
        } else {
          const data = { target: `${assets?.data?.data[index]?._id}` };
          edgeFromTicketToClosed.push(data);
        }
      });

      var indexData = 0;
      allTicketsAssets?.map((item) => {
        if (indexData <= item.length) {
          indexData = item.length;
        }
      });
      if (indexData !== 0) xPosition += 300 * indexData;

      if (repairStatus === REPAIR_JOB_STATUS.completed) {
        xPosition += 300;
        flow.push({
          id: `${repairId}-closed`,
          type: 'output',
          className: 'dark-node',
          targetPosition: 'left',
          data: {
            ref_type: 'repairJob',
            ref_id: repairId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.repairJob.name}</Typography>
                <Typography variant="subtitle2">{repairJobName ?? repairJobName}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.closedRepairJob
        });

        edgeFromTicketToClosed?.map((item, index) => {
          flowEdge.push({
            id: `edge-asset-${repairId}-${index}-closed`,
            source: `${item.target}`,
            arrowHeadType: 'arrow',
            target: `${repairId}-closed`
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
      case 'repairJob':
        break;
      case 'deliveryTicket':
        window.open(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullScreenOpen} setFullScreen={setFullScreenOpen}>
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
          >
            {'Color Info'} {colorInfo ? <ExpandLess /> : <ExpandMore />}
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
export default RepairJobViews;
