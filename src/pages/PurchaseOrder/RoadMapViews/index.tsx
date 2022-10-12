import _ from 'lodash';
import React, { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { COLOUR_MASTER, purchaseOrder, PURCHASE_ORDER_STATUS } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';

const customNodeStyles = {
  purchaseOrder: {
    name: 'Purchase Order',
    ...COLOUR_MASTER.purchaseOrder
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.product
  },
  productAssets: {
    name: 'Assets',
    ...COLOUR_MASTER.assets
  },
  serialNumber: {
    name: 'Serial Number',
    ...COLOUR_MASTER.transferAsset
  },
  receiving: {
    name: 'Receiving',
    ...COLOUR_MASTER.receivingTicket
  }
};

const customDeliveredNodeStyle = {
  closedPurchaseOrder: {
    name: 'Purchase Order',
    ...COLOUR_MASTER.closedRentalJob
  }
};

const PurchaseOrderViews = (props) => {
  const { pName, pId, pStatus } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const product = await axiosInstance().get(`${purchaseOrder.api}/product/${pId}`);
      const assets = await axiosInstance().get(`${purchaseOrder.api}/${pId}/assets`);
      const allProducts = product?.data?.data;
      const allSerializedAssets = assets?.data?.data?.serializedAsset;
      const allSerialNumber = assets?.data?.data?.productSerialNumber;

      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${pId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'purchaseOrder',
            ref_id: pId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pName ?? pName}</div>
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.purchaseOrder
        }
      ];
      var flowEdge: any[] = [];
      xPosition += 300;
      var productReceived = 0;
      const allProductId = {};
      allProducts?.map((item, pIdx) => {
        allProductId[`${item?.productId}_${item?._id}`] = item?._id;
        if (item?.actualReceived > 0) productReceived += 1;
        flow.push({
          id: `${item?.productId}_${item?._id}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'product',
            ref_id: item?.productId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item?.productDetail?.productName}</div>
          },
          position: { x: xPosition, y: pIdx * 80 },
          style: customNodeStyles.product
        });
        flowEdge.push({
          id: `${pId}_${item?.productId}_${item?._id}_edge`,
          source: `${pId}`,
          target: `${item?.productId}_${item?._id}`
        });
      });

      const serialisedAssetInProduct = {};
      if (allSerializedAssets?.length > 0 || allSerialNumber?.length > 0) {
        var assetYIdx = 0;
        xPosition += 300;
        allSerializedAssets?.map((item, sIdx) => {
          serialisedAssetInProduct[item?.product?.optionValue] = true;
          flow.push({
            id: `${item?._id}`,
            type: 'default',
            className: 'dark-node',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'asset',
              ref_id: item?._id,
              label: (
                <HtmlTooltip arrow placement="top" title={item?.status}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item?.assetNumber}</div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition, y: assetYIdx * 80 },
            style: customNodeStyles.productAssets
          });
          assetYIdx += 1;
          flowEdge.push({
            id: `${pId}_${item._id}_edge_asset_product`,
            source: `${item?.product?.optionValue}`,
            target: `${item._id}`
          });
        });
        allSerialNumber?.map((item, sIdx) => {
          serialisedAssetInProduct[item?.product] = true;
          flow.push({
            id: `${item?._id}`,
            type: 'default',
            className: 'dark-node',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'serialNumber',
              ref_id: item?._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item?.serialNumber}</div>
            },
            position: { x: xPosition, y: assetYIdx * 80 },
            style: customNodeStyles.serialNumber
          });
          assetYIdx += 1;
          flowEdge.push({
            id: `${pId}_${item._id}_edge_asset_product`,
            source: `${item?.product}`,
            target: `${item._id}`
          });
        });
      }
      if (productReceived) {
        xPosition += 300;
        flow.push({
          id: `${pId}_received`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'received',
            ref_id: pId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Received</div>
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.receiving
        });
        allProducts
          // ?.filter((i) => !serialisedAssetInProduct[i?.productId] && i?.actualReceived > 0)
          ?.map((item, pIdx) => {
            flowEdge.push({
              id: `${pId}_${item}_received_edge`,
              source: `${item?.productId}_${item?._id}`,
              target: `${pId}_received`
            });
          });
        allSerializedAssets?.map((item, sIdx) => {
          flowEdge.push({
            id: `${pId}_${item}_received_edge`,
            source: `${item?._id}`,
            target: `${pId}_received`
          });
        });
        allSerialNumber?.map((item, sIdx) => {
          flowEdge.push({
            id: `${pId}_${item}_received_edge`,
            source: `${item?._id}`,
            target: `${pId}_received`
          });
        });
      }

      if (pStatus === PURCHASE_ORDER_STATUS.closed) {
        xPosition += 300;
        flow.push({
          id: `${pId}_closed`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'purchaseOrder',
            ref_id: pId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pName ?? pName}</div>
          },
          position: { x: xPosition, y: 80 },
          style: customDeliveredNodeStyle.closedPurchaseOrder
        });
        flowEdge.push({
          id: `${pId}_closed_edge`,
          source: `${pId}_received`,
          target: `${pId}_closed`
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
      case 'product':
        history.push(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        history.push(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'serialNumber':
        break;
      case 'purchaseOrder':
        history.push(`${routes.purchaseOrderDetail.path}/${element.data.ref_id}`);
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

export default PurchaseOrderViews;
