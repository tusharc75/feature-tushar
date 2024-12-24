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
import { COLOUR_MASTER, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_TYPE, deliveryTicket } from 'src/constants/helpers';

const customNodeStyles = {
  subcontractAssembly: {
    name: 'Subcontract Assembly',
    ...COLOUR_MASTER.purchaseOrder
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.product
  },
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.loadingTicket
  },
  receivingTicket: {
    name: 'Receiving Ticket',
    ...COLOUR_MASTER.receivingTicket
  }
};

const IrtTicketView = ({ subcontractAssemblyData }) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [subcontractAssemblyData]);

  const fetchData = async () => {
    setLoading(true);
    const res: any = await axiosInstance().get(`${routes?.subcontractAssembly?.path}/${subcontractAssemblyData?._id}/material`);
    const materials = res?.data?.data?.material;

    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
    );
    const deliveryTicketList = result?.data?.data;
    const loadingTicket = deliveryTicketList?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.delivery);

    var xPosition = 0;
    var flow: any = [
      {
        id: subcontractAssemblyData?._id,
        type: 'input',
        className: 'dark-node',
        sourcePosition: 'right',
        data: {
          ref_type: 'subcontractAssembly',
          ref_id: subcontractAssemblyData?._id,
          label: (
            <HtmlTooltip arrow placement="top" title={'Subcontract Assembly'}>
              <div>
                <Typography variant="body2">{customNodeStyles.subcontractAssembly.name}</Typography>
                <Typography variant="subtitle2">{subcontractAssemblyData?.subcontractAssemblyNumber}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: 70 },
        style: customNodeStyles.subcontractAssembly
      }
    ];
    const flowEdge: any = [];

    if (materials?.length) xPosition += 300;
    let staringPosition = xPosition;
    let lastIndex = 0;
    const materialWithPostition: any = {};
    materials?.forEach((material, index) => {
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
            <HtmlTooltip
              arrow
              placement="top"
              title={material?.type === 'product' ? 'Product' : material?.type === 'package' ? 'Package' : 'Service'}
            >
              <div>
                <Typography variant="body2">
                  {material?.type === 'product' ? 'Product' : material?.type === 'package' ? 'Package' : 'Service'}
                </Typography>
                <Typography variant="subtitle2">{material?.productDetail?.productName}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 100 },
        style: customNodeStyles.product
      });

      flowEdge.push({
        id: `${material?.parentId}-${material?._id}-edge`,
        source: material?.parentId ? material?.parentId : subcontractAssemblyData?._id,
        target: material?._id,
        arrowHeadType: 'arrow'
      });
    });

    if (loadingTicket?.length) xPosition += 300;
    loadingTicket?.forEach((obj: any, index) => {
      flow.push({
        id: obj?._id,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: obj?.ticketType,
          ref_id: obj?._id,
          label: (
            <HtmlTooltip
              arrow
              placement="top"
              title={
                <>
                  <p>
                    <Typography variant="body2">From:</Typography>
                    <Typography variant="subtitle2">{obj?.pickupFrom?.optionLabel}</Typography>
                  </p>
                  <p>
                    <Typography variant="body2">To:</Typography>
                    <Typography variant="subtitle2">{obj?.deliveryTo?.optionLabel}</Typography>
                  </p>
                </>
              }
            >
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Typography variant="body2">{obj.ticketType} Ticket</Typography>
                <Typography variant="subtitle2">{obj.ticketName}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 100 },
        style: obj?.ticketType === 'Delivery' ? customNodeStyles.loadingTicket : ''
      });
      obj?.products?.forEach((p: any) => {
        flowEdge.push({
          id: `${p.uniqueId}-${obj?._id}-edge`,
          source: p.uniqueId,
          target: obj?._id,
          arrowHeadType: 'arrow'
        });
      });
    });

    let rows = materials?.filter((d: any) => {
      !d.parentId && d.receivedQty > 0;
    });
    if (rows?.length) xPosition += 300;
    rows?.forEach((material, index) => {
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
            <HtmlTooltip
              arrow
              placement="top"
              title={material?.type === 'product' ? 'Product' : material?.type === 'package' ? 'Package' : 'Service'}
            >
              <div>
                <Typography variant="body2">
                  {material?.type === 'product' ? 'Product' : material?.type === 'package' ? 'Package' : 'Service'}
                </Typography>
                <Typography variant="subtitle2">{material?.productDetail?.productName}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 100 },
        style: customNodeStyles.product
      });
      materials?.forEach((material, index) => {
        if (material.parentId) {
          let ticket = loadingTicket.filter((d: any) => {
            d.products[0]?.product === material.materialId;
          });

          flowEdge.push({
            id: `${ticket._id}-${material?._id}-edge`,
            source: ticket._id,
            target: material?._id,
            arrowHeadType: 'arrow'
          });
        }
      });
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
    } else if (element?.data?.ref_type === 'subcontractAssembly') {
      window.open(`${routes.subcontractAssemblyDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data.ref_type === 'Delivery') {
      window.open(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
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
