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
import { COLOUR_MASTER, IRT_APPROVER_STATUS } from 'src/constants/helpers';

const customNodeStyles = {
  irtTicketNumber: {
    name: 'Irt Ticket Number',
    ...COLOUR_MASTER.purchaseOrder
  },
  purchaseOrder: {
    name: 'Purchase Order',
    ...COLOUR_MASTER.product
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.service
  },
  send: {
    name: 'Approver-Send',
    ...COLOUR_MASTER.loadingTicket
  },
  approve: {
    name: 'Approver-Approved',
    ...COLOUR_MASTER.accepted
  },
  decline: {
    name: 'Approver-Declined',
    ...COLOUR_MASTER.rejected
  }
};

const IrtTicketView = ({ id }) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);

    const irtTicketResponce: any = await axiosInstance().get(`${routes?.irtTicket?.path}/${id}`);
    const approverResponce: any = await axiosInstance().get(`${routes?.irtTicket?.path}/approver/${id}`);

    const irtTicketData: any = irtTicketResponce?.data?.data;
    const approver: any = approverResponce?.data?.data;

    var xPosition = 0;
    var flow: any = [
      {
        id: irtTicketData?._id,
        type: 'input',
        className: 'dark-node',
        sourcePosition: 'right',
        data: {
          ref_type: 'irtTicketNumber',
          ref_id: irtTicketData?._id,
          label: (
            <HtmlTooltip arrow placement="top" title={'IRT Ticket'}>
              <div>
                <Typography variant="body2">{customNodeStyles.irtTicketNumber.name}</Typography>
                <Typography variant="subtitle2">{irtTicketData?.irtTicketNumber}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: 70 },
        style: customNodeStyles.irtTicketNumber
      }
    ];

    var flowEdge: any[] = [];
    xPosition += 300;
    flow.push({
      id: irtTicketData?.purchaseOrder?.optionValue,
      type: 'default',
      className: 'dark-node',
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        ref_type: 'purchaseOrder',
        ref_id: irtTicketData?.purchaseOrder?.optionValue,
        label: (
          <HtmlTooltip arrow placement="top" title={'Purchase Order'}>
            <div>
              <Typography variant="body2">{customNodeStyles.purchaseOrder.name}</Typography>
              <Typography variant="subtitle2">{irtTicketData?.purchaseOrder?.optionLabel}</Typography>
            </div>
          </HtmlTooltip>
        )
      },
      position: { x: xPosition, y: 70 },
      style: customNodeStyles.purchaseOrder
    });

    flowEdge.push({
      id: `${irtTicketData?._id}_edge`,
      source: irtTicketData?._id,
      target: irtTicketData?.purchaseOrder?.optionValue
    });

    xPosition += 300;
    flow.push({
      id: irtTicketData?.product?.optionValue,
      type: 'default',
      className: 'dark-node',
      sourcePosition: 'right',
      targetPosition: 'left',
      data: {
        ref_type: 'product',
        ref_id: irtTicketData?.product?.optionValue,
        label: (
          <HtmlTooltip arrow placement="top" title={'Product'}>
            <div>
              <Typography variant="body2">{customNodeStyles.product.name}/Part</Typography>
              <Typography variant="subtitle2">{irtTicketData?.product?.optionLabel}</Typography>
              <Typography variant="body2">{`Qty : ${irtTicketData?.qty}`}</Typography>
              <Typography variant="body2">{`PO Amount : $ ${irtTicketData?.amount}`}</Typography>
            </div>
          </HtmlTooltip>
        )
      },
      position: { x: xPosition, y: 50 },
      style: customNodeStyles.product
    });

    flowEdge.push({
      id: `${irtTicketData?.purchaseOrder?.optionValue}_edge`,
      source: irtTicketData?.purchaseOrder?.optionValue,
      target: irtTicketData?.product?.optionValue
    });

    xPosition += 300;
    approver?.map((s, index) => {
      const flowId = `${index}_${s?.user?.optionValue}`;

      flow.push({
        id: flowId,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: 'user',
          ref_id: s?.user?.optionValue,
          label: (
            <HtmlTooltip arrow placement="top" title={'Approver'}>
              <div>
                <Typography variant="subtitle2">{s?.type}</Typography>
                <Typography variant="subtitle2">{s?.user.optionLabel}</Typography>
                <Typography variant="subtitle2">{s?.status}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: index * 120 },
        style:
          s?.status === IRT_APPROVER_STATUS.send
            ? customNodeStyles.send
            : s?.status === IRT_APPROVER_STATUS.approved
              ? customNodeStyles.approve
              : customNodeStyles.decline
      });

      flowEdge.push({
        id: `${s._id}_edge`,
        source: `${irtTicketData?.product?.optionValue}`,
        target: flowId
      });

      if (index === 0 && [IRT_APPROVER_STATUS.approved, IRT_APPROVER_STATUS.declined]?.includes(irtTicketData?.status)) {
        flow.push({
          id: 'closed',
          type: 'output',
          className: 'dark-node',
          targetPosition: 'left',
          data: {
            ref_type: 'closed',
            ref_id: 'closed',
            label: (
              <HtmlTooltip arrow placement="top" title={'IRT Ticket'}>
                <div>
                  <Typography variant="body2">IRT Ticket</Typography>
                  <Typography variant="subtitle2">{irtTicketData?.status}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition + 300, y: 70 },
          style: irtTicketData?.status === IRT_APPROVER_STATUS.approved ? customNodeStyles.approve : customNodeStyles.decline
        });
      }

      flowEdge.push({
        id: `closed`,
        source: flowId,
        target: 'closed'
      });

      index++;
    });

    setFlowData([...flow, ...flowEdge]);
    setLoading(false);
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    if (element?.data?.ref_type === 'purchaseOrder') {
      window.open(`${routes.purchaseOrderDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'product') {
      window.open(`${routes.productDetail.path}/${element?.data?.ref_id}`);
    } else if (element?.data?.ref_type === 'user') {
      window.open(`${routes.userDetail.path}/${element?.data?.ref_id}`);
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
