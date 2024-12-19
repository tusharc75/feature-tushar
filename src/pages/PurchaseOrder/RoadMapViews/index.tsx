import { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { COLOUR_MASTER, purchaseOrder } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import { useData } from 'src/StateProvider/Provider';

const PurchaseOrderViews = ({ purchaseOrderData }) => {
  const {
    state: { resources }
  }: any = useData();

  const customNodeStyles = {
    purchaseOrder: {
      name: resources?.purchaseOrder?.titleSingular,
      ...COLOUR_MASTER.purchaseOrder
    },
    product: {
      name: 'Product',
      ...COLOUR_MASTER.product
    },
    service: {
      name: 'Service',
      ...COLOUR_MASTER.service
    },
    manualEntry: {
      name: 'Manual Entry',
      ...COLOUR_MASTER.product
    },
    assets: {
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
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, [purchaseOrderData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const product = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData?._id}`);
      const assets = await axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData?._id}/assets`);
      const service = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData?._id}`);
      const manualEntry = await axiosInstance().get(`${purchaseOrder.api}/cost/${purchaseOrderData?._id}`);
      const allProducts = product?.data?.data;
      const allManualEntry = manualEntry?.data?.data;
      const allSerializedAssets = assets?.data?.data?.serializedAsset;
      const allSerialNumber = assets?.data?.data?.productSerialNumber;
      const allService = service?.data?.data;

      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${purchaseOrderData?._id}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'purchaseOrder',
            ref_id: purchaseOrderData?._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.purchaseOrder.name}</Typography>
                <Typography variant="subtitle2">{purchaseOrderData?.purchaseOrderNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.purchaseOrder
        }
      ];
      var flowEdge: any[] = [];
      xPosition += 300;
      var yPosition = 0;
      var productReceived = 0;
      const allProductId = {};
      allProducts?.map((item) => {
        allProductId[item?.productId] = `${item?.productId}_${item?._id}`;
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
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.product.name}</Typography>
                <Typography variant="subtitle2">{item?.productDetail?.productName}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: yPosition },
          style: customNodeStyles.product
        });
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item?.productId}_${item?._id}_edge`,
          source: `${purchaseOrderData?._id}`,
          target: `${item?.productId}_${item?._id}`
        });
        yPosition += 80;
      });
      allService?.map((item) => {
        flow.push({
          id: `${item?.serviceId}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'service',
            ref_id: item?.serviceId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.service.name}</Typography>
                <Typography variant="subtitle2">{item?.serviceDetail?.serviceName}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: yPosition },
          style: customNodeStyles.service
        });
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item?.serviceId}_edge`,
          source: `${purchaseOrderData?._id}`,
          target: `${item?.serviceId}`
        });
        yPosition += 80;
      });
      allManualEntry?.map((item) => {
        flow.push({
          id: `${item?._id}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'manualEntry',
            ref_id: item?._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{customNodeStyles.manualEntry.name}</Typography>
                <Typography variant="subtitle2">{item?.description}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: yPosition },
          style: customNodeStyles.manualEntry
        });
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item?._id}_edge`,
          source: `${purchaseOrderData?._id}`,
          target: `${item?._id}`
        });
        yPosition += 80;
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
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Typography variant="body2">{customNodeStyles.assets.name}</Typography>
                    <Typography variant="subtitle2">{item?.assetNumber}</Typography>
                  </div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition, y: assetYIdx * 80 },
            style: customNodeStyles.assets
          });
          assetYIdx += 1;
          flowEdge.push({
            id: `${purchaseOrderData?._id}_${item._id}_edge_asset_product`,
            source: `${allProductId[item?.product?.optionValue]}`,
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
              label: (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2">{customNodeStyles.serialNumber.name}</Typography>
                  <Typography variant="subtitle2">{item?.serialNumber}</Typography>
                </div>
              )
            },
            position: { x: xPosition, y: assetYIdx * 80 },
            style: customNodeStyles.serialNumber
          });
          assetYIdx += 1;
          flowEdge.push({
            id: `${purchaseOrderData?._id}_${item._id}_edge_asset_product`,
            source: `${allProductId[item?.product]}`,
            target: `${item._id}`
          });
        });
      }

      xPosition += 300;
      flow.push({
        id: `${purchaseOrderData?._id}_received`,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: 'received',
          ref_id: purchaseOrderData?._id,
          label: (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Typography variant="body2">Status</Typography>
              <Typography variant="subtitle2">{purchaseOrderData?.status}</Typography>
            </div>
          )
        },
        position: { x: xPosition, y: 80 },
        style: customNodeStyles.receiving
      });
      allProducts
        ?.filter((i) => !serialisedAssetInProduct[i?.productId])
        ?.map((item, pIdx) => {
          flowEdge.push({
            id: `${purchaseOrderData?._id}_${item}_received_edge`,
            source: `${item?.productId}_${item?._id}`,
            target: `${purchaseOrderData?._id}_received`
          });
        });

      allService?.map((item) => {
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item?.serviceId}_received_edge`,
          source: `${item?.serviceId}`,
          target: `${purchaseOrderData?._id}_received`
        });
      });

      allManualEntry?.map((item) => {
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item?._id}_received_edge`,
          source: `${item?._id}`,
          target: `${purchaseOrderData?._id}_received`
        });
      });
      allSerializedAssets?.map((item, sIdx) => {
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item}_received_edge`,
          source: `${item?._id}`,
          target: `${purchaseOrderData?._id}_received`
        });
      });
      allSerialNumber?.map((item, sIdx) => {
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${item}_received_edge`,
          source: `${item?._id}`,
          target: `${purchaseOrderData?._id}_received`
        });
      });
      if (flowEdge.length === 0) {
        flowEdge.push({
          id: `${purchaseOrderData?._id}_${purchaseOrderData?._id}_edge`,
          source: `${purchaseOrderData?._id}`,
          target: `${purchaseOrderData?._id}_received`
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
        window.open(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        window.open(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'service':
        window.open(`${routes.serviceMasterDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        window.open(`${routes.serviceMasterDetail.path}/${element.data.ref_id}`);
        break;
      case 'serialNumber':
        break;
      case 'purchaseOrder':
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

export default PurchaseOrderViews;
