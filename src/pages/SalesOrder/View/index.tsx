import { Box, Button, Paper, Typography } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { useHistory } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { lowerFirst, startCase } from 'lodash';
import { COLOUR_MASTER, MATERIAL_TYPE } from 'src/constants/helpers';

const customNodeStyles = {
  salesOrder: {
    name: 'Sales Order',
    ...COLOUR_MASTER.purchaseOrder
  },
  package: {
    name: 'Package',
    ...COLOUR_MASTER.package
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.product
  },
  service: {
    name: 'Service',
    ...COLOUR_MASTER.service
  },
  demandOrder: {
    name: 'Demand Order',
    ...COLOUR_MASTER.repairJob
  },
  productionOrder: {
    name: 'Production Order',
    ...COLOUR_MASTER.assets
  },
  purchaseRequisition: {
    name: 'Purchase Requisition',
    ...COLOUR_MASTER.bulkAsset
  }
  // decline: {
  //   name: 'Approver-Declined',
  //   background: '#FFEAEA',
  //   borderColor: '#FFA0A0'
  // }
};

const IrtTicketView = ({ salesOrderData }) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [salesOrderData]);

  const fetchData = async () => {
    setLoading(true);
    const materialData: any = await axiosInstance().get(`${routes?.salesOrder?.path}/material/${salesOrderData?._id}`);
    const additionalcostData: any = await axiosInstance().get(`${routes?.salesOrder?.path}/additionalcost/${salesOrderData?._id}`);

    const costData = additionalcostData?.data?.data || [];
    costData?.forEach((e) => {
      e.type = MATERIAL_TYPE.manualEntry;
    });
    const materials = [...(materialData?.data?.data?.material || []), ...costData];

    var xPosition = 0;
    var flow: any = [
      {
        id: salesOrderData?._id,
        type: 'input',
        className: 'dark-node',
        sourcePosition: 'right',
        data: {
          ref_type: 'salesOrder',
          ref_id: salesOrderData?._id,
          label: (
            <HtmlTooltip arrow placement="top" title={'Sales Order'}>
              <div>
                <Typography variant="body2">{customNodeStyles.salesOrder.name}</Typography>
                <Typography variant="subtitle2">{salesOrderData?.salesOrderNo}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: 70 },
        style: customNodeStyles.salesOrder
      }
    ];
    const flowEdge: any = [];

    if (materials?.length) xPosition += 300;
    let staringPosition = xPosition;
    let lastIndex = 0;
    const materialWithPostition: any = {};
    const materialWithProcurement: any = {};
    materials?.forEach((material, index) => {
      if (material?.procurementType)
        materialWithProcurement[material?.procurementType] = {
          procurementType: material?.procurementType,
          procurement: material?.procurement,
          procurementId: material?.procurementId
        };
      const isChild = material?.parentId;
      if (isChild) {
        const parentPosition = materialWithPostition[material?.parentId];
        xPosition = parentPosition + 300;
      } else {
        xPosition = staringPosition;
      }
      if (lastIndex < xPosition) lastIndex = xPosition;
      materialWithPostition[material?._id] = xPosition;

      flow.push({
        id: material?._id,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: material?.type,
          ref_id: material?.materialId,
          label: (
            <HtmlTooltip arrow placement="top" title={startCase(material?.type)}>
              <div>
                <Typography variant="body2">{startCase(material?.type)}</Typography>
                <Typography variant="subtitle2">
                  {material?.productDetail?.productName ||
                    material?.packageDetail?.packageName ||
                    material?.serviceDetail?.serviceName ||
                    material?.description}
                </Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 100 },
        style:
          material?.type === 'product' ? customNodeStyles.product : material?.type === 'package' ? customNodeStyles.package : customNodeStyles.service
      });

      flowEdge.push({
        id: `${material?.parentId}-${material?._id}-edge`,
        source: material?.parentId ? material?.parentId : salesOrderData?._id,
        target: material?._id,
        arrowHeadType: 'arrow'
      });
    });
    xPosition = lastIndex;
    if (Object.keys(materialWithProcurement).length) xPosition += 300;
    Object.keys(materialWithProcurement)?.forEach((key, index) => {
      flow.push({
        id: materialWithProcurement[key]?.procurementId,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: lowerFirst(key)?.replace(/\s/g, ''),
          ref_id: materialWithProcurement[key]?.procurementId,
          label: (
            <HtmlTooltip arrow placement="top" title={key}>
              <div>
                <Typography variant="body2">{key}</Typography>
                <Typography variant="subtitle2">{materialWithProcurement[key]?.procurement?.optionLabel}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 100 },
        style: customNodeStyles[lowerFirst(key)?.replace(/\s/g, '')]
      });
    });
    materials?.forEach((material, index) => {
      if (material?.procurementType) {
        flowEdge.push({
          id: `${material?._id}-${materialWithProcurement[material?.procurementType]?.procurementId}-edge`,
          arrowHeadType: 'arrow',
          source: material?._id,
          target: materialWithProcurement[material?.procurementType]?.procurementId
        });
      }
    });

    setFlowData([...flow, ...flowEdge]);
    setLoading(false);
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    if (element?.data?.ref_type === 'product') {
      window.open(`${routes.productDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'package') {
      window.open(`${routes.packagesDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'service') {
      window.open(`${routes.serviceMasterDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'salesOrder') {
      window.open(`${routes.salesOrderDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'demandOrder') {
      window.open(`${routes.demandOrderDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'productionOrder') {
      window.open(`${routes?.productionOrderDetail?.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'purchaseRequisition') {
      window.open(`${routes.purchaseRequisitionDetail.path}/${element?.data?.ref_id}`);
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

export default IrtTicketView;
