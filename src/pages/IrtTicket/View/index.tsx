import { Box, Button, Paper } from '@material-ui/core';
import  { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useHistory } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const customNodeStyles = {
  irtTicketNumber: { name: 'Irt Ticket Number', background: '#c3d5e6', borderColor: '#6c89a6' },
  purchaseOrder: {
    name: 'Purchase Order',
    background: '#97c9bf',
    borderColor: '#70948d'
  },
  product: {
    name: 'Product',
    background: 'rgb(255, 214, 91)',
    borderColor: '#C0C0C0'
  },
  approver: {
    name: 'Approver',
    background: 'rgba(222, 249, 255, 1)',
    borderColor: 'green'
  },
  approvedStatus: {
    name: 'Approved Status',
    background: '#cfdb7f',
    borderColor: '#aeb86e'
  },
  closed: {
    name: 'Closed',
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  }
};

const IrtTicketView = ({ irtTicketData }) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { _id, irtTicketNumber, product, purchaseOrder } = irtTicketData;

  useEffect(() => {
    fetchData();
  }, [irtTicketData]);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes?.irtTicket?.path}/approver/${irtTicketData?._id}`)
      .then(({ data: { data } }) => {
        var xPosition = 0;
        var flow: any = [
          {
            id: `${_id}`,
            type: 'input',
            className: 'dark-node',
            sourcePosition: 'right',
            data: {
              ref_type: 'irtTicketNumber',
              ref_id: _id,
              label: (
                <HtmlTooltip arrow placement="top" title={'Irt Ticket Number'}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{irtTicketNumber ?? ''}</div>
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
          id: `${purchaseOrder?.optionValue}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'purchaseOrder',
            ref_id: purchaseOrder?.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={'Purchase Order'}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{purchaseOrder?.optionLabel}</div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 0 * 80 },
          style: customNodeStyles.purchaseOrder
        });
        flowEdge.push({
          id: `${_id}_edge`,
          source: `${_id}`,
          target: `${purchaseOrder?.optionValue}`
        });
        xPosition += 300;
        flow.push({
          id: `${product?.optionValue}`,
          type: 'default',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'product',
            ref_id: product?.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={'Product'}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product?.optionLabel}</div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 0 * 80 },
          style: customNodeStyles.product
        });
        flowEdge.push({
          id: `${purchaseOrder.optionValue}_edge`,
          source: `${purchaseOrder.optionValue}`,
          target: `${product?.optionValue}`
        });
        xPosition += 300;
        data?.map((s, sidx) => {
          const flowId = `${sidx}_${s?.user?.optionValue}`;
          const flowIdStatus = `${sidx}_${s?.user?.optionValue}_${s?.user?.status}`;
          flow.push({
            id: flowId,
            type: 'default',
            className: 'dark-node',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'approver',
              ref_id: s?.user?.optionValue,
              label: (
                <HtmlTooltip arrow placement="top" title={'Approver'}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s?.user.optionLabel}</div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition, y: sidx * 80 },
            style: customNodeStyles.approver
          });
          flowEdge.push({
            id: `${s._id}_edge`,
            source: `${product.optionValue}`,
            target: flowId
          });
          flow.push({
            id: flowIdStatus,
            type: 'default',
            className: 'dark-node',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'approvedStatus',
              ref_id: s?._id,
              label: (
                <HtmlTooltip arrow placement="top" title={'Approved Status'}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s?.status}</div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition + 300, y: sidx * 80 },
            style: customNodeStyles.approvedStatus
          });
          flowEdge.push({
            id: `${s._id}_edge_status`,
            source: flowId,
            target: flowIdStatus
          });
          if (sidx === 0) {
            flow.push({
              id: 'closed',
              type: 'default',
              className: 'dark-node',
              sourcePosition: 'right',
              targetPosition: 'left',
              data: {
                ref_type: 'closed',
                ref_id: 'closed',
                label: (
                  <HtmlTooltip arrow placement="top" title={'Closed'}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Closed</div>
                  </HtmlTooltip>
                )
              },
              position: { x: xPosition + 600, y: sidx * 80 },
              style: customNodeStyles.closed
            });
          }
          flowEdge.push({
            id: `closed`,
            source: flowIdStatus,
            target: 'closed'
          });
          sidx++;
        });

        setFlowData([...flow, ...flowEdge]);
        setLoading(false);
      });
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };
  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'irtTicketNumber':
        history.push(`${routes.irtTicketDetail.path}/${irtTicketData?._id}`);
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

export default IrtTicketView;
