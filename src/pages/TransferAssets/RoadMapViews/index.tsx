import _ from 'lodash';
import React, { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { COLOUR_MASTER, transferAsset, deliveryTicket, DELIVERY_TICKET_STATUS, sidebarResource } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';

const customDeliveredNodeStyle = {
  closedTransferAsset: {
    name: 'Closed Transfer Asset',
    ...COLOUR_MASTER.closedRepairJob
  }
};
const customNodeStyles = {
  transferAsset: {
    name: 'Transfer Asset',
    ...COLOUR_MASTER.purchaseOrder
  },
  productAssets: {
    name: 'Assets',
    ...COLOUR_MASTER.assets
  },
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.loadingTicket
  },
  ...customDeliveredNodeStyle
};

const TransferAssetViews = (props) => {
  const { tANumber, tAId } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tANumber, tAId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const assets = await axiosInstance().get(`${transferAsset.api}/get-asset/${tAId}`);
      const loadingTicket = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${sidebarResource.transferAsset}&referenceId=${tAId}`
      );
      const allAssets = assets?.data?.data?.assets || [];
      const allLoadingTicket = loadingTicket?.data?.data || [];
      const ifAnyDeliveredLoadingTickets = allLoadingTicket.find((lt) => lt.status === DELIVERY_TICKET_STATUS.delivered);
      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${tAId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'transferAsset',
            ref_id: tAId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.transferAsset.name}</Typography>
                <Typography variant="subtitle2">{tANumber ?? tANumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 30 },
          style: customNodeStyles.transferAsset
        }
      ];
      var flowEdge: any[] = [];

      if (allAssets.length) xPosition += 300;
      allAssets?.map((asset, aIdx) => {
        flow.push({
          id: `${asset._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'asset',
            ref_id: asset._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.productAssets}</Typography>
                <Typography variant="subtitle2">{asset.assetNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: aIdx * 70 },
          style: customNodeStyles.productAssets
        });
        flowEdge.push({
          id: `ta-asset-${tANumber}-${asset._id}`,
          source: tAId,
          arrowHeadType: 'arrow',
          target: asset._id
        });
      });
      if (allLoadingTicket.length && allAssets.length) xPosition += 300;
      allLoadingTicket?.map((loadingTicket, lIdx) => {
        flow.push({
          id: `${loadingTicket._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'loadingTicket',
            ref_id: loadingTicket._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.loadingTicket.name}</Typography>
                <Typography variant="subtitle2">{loadingTicket.ticketName}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: lIdx * 70 },
          style: customNodeStyles.loadingTicket
        });
        loadingTicket?.assets?.map((_asset) => {
          flowEdge.push({
            id: `asset-loading-${_asset?.asset}-${loadingTicket._id}`,
            source: _asset?.asset,
            target: loadingTicket._id,
            arrowHeadType: 'arrow'
          });
        });
      });
      if (ifAnyDeliveredLoadingTickets && allLoadingTicket.length) {
        xPosition += 300;
        flow.push({
          id: `${tAId}-delivered`,
          type: 'output',
          className: 'dark-node',
          targetPosition: 'left',
          data: {
            ref_type: 'transferAsset',
            ref_id: tAId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.closedTransferAsset.name}</Typography>
                <Typography variant="subtitle2">{tANumber ?? tANumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 30 },
          style: customDeliveredNodeStyle.closedTransferAsset
        });
        allLoadingTicket
          ?.filter((lt) => lt.status == DELIVERY_TICKET_STATUS.delivered)
          ?.map((loadingTicket) => {
            flowEdge.push({
              id: `delivered-${tAId}-from-${loadingTicket._id}`,
              source: loadingTicket._id,
              target: `${tAId}-delivered`,
              arrowHeadType: 'arrow'
            });
          });
      }

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'asset':
        window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'loadingTicket':
        window.open(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={setFullDialogueOpen}>
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
      <div style={fullDialogueOpen ? { height: '95vh' } : { height: '68vh' }}>
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
};

export default TransferAssetViews;
