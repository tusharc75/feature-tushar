import { Box, Paper, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { COLOUR_MASTER, fieldServiceOrder, fieldTicket, invoice, MATERIAL_TYPE, SERVICE_ORDER_STATUS, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';

const customNodeStyles = {
  fieldServiceOrder: {
    name: sidebarResource?.fieldServiceOrder,
    ...COLOUR_MASTER.purchaseOrder
  },
  fieldTicket: {
    name: 'Field Ticket',
    ...COLOUR_MASTER.product
  },
  invoice: {
    name: 'Invoice',
    ...COLOUR_MASTER.service
  },
  serviceOrderClosed: {
    name: `${sidebarResource?.fieldServiceOrder} Closed`,
    ...COLOUR_MASTER.receivingTicket
  }
};

function FieldServiceOrderView({ fieldServiceOrderData }) {

  const toastConfig = useContext(CustomToastContext);
  const [colorInfo, setColorInfo] = useState(false);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);

  const {
    state: { permissions, resources }
  }: any = useData();

  useEffect(() => {
    fetchData();
  }, [fieldServiceOrderData._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let fieldTickets: any = await axiosInstance().get(`${fieldTicket.api}?filterById=${JSON.stringify([{ field: 'fieldServiceOrder', term: fieldServiceOrderData?._id }])}`);
      fieldTickets = fieldTickets?.data?.data

      let invoices: any = []
      if (permissions?.invoice?.isRead) {
        invoices = await axiosInstance().get(`${invoice.api}?fieldServiceOrder=${fieldServiceOrderData?._id}`)
        invoices = invoices?.data?.data;
      }

      var xPosition = 0;
      var flowEdge: any[] = [];

      var flow: any[] = [
        {
          id: `${fieldServiceOrderData?._id}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            label: (
              <div>
                <Typography variant="body2">{resources?.fieldServiceOrder?.titleSingular}</Typography>
                <Typography variant="subtitle2">{fieldServiceOrderData?.fieldServiceOrderNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.fieldServiceOrder
        }
      ];

      const allFieldTickets = [];
      if (fieldTickets?.length) {
        xPosition += 300;
        fieldTickets?.map((fieldTicket, index) => {
          allFieldTickets.push(fieldTicket._id);
          flow.push({
            id: fieldTicket?._id,
            type: 'default',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_url: routes.fieldTicketDetail.path,
              ref_id: fieldTicket?._id,
              label: (
                <div>
                  <Typography variant="body2">{resources?.fieldTicket?.titleSingular}</Typography>
                  <Typography variant="subtitle2">{fieldTicket?.fieldTicketNumber}</Typography>
                </div>
              )
            },
            position: { x: xPosition, y: 80 * index },
            style: customNodeStyles.fieldTicket
          });
          flowEdge.push({
            id: fieldTicket?._id,
            source: `${fieldServiceOrderData?._id}`,
            target: fieldTicket?._id,
            arrowHeadType: 'arrow'
          });
        });
      }

      if (invoices?.length) {
        xPosition += 300;
        invoices?.map((invoice, index) => {
          flow.push({
            id: invoice?._id,
            type: 'default',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_url: routes.invoiceDetail.path,
              ref_id: invoice?._id,
              label: (
                <div>
                  <Typography variant="body2">{resources?.invoice?.titleSingular}</Typography>
                  <Typography variant="subtitle2">{invoice?.invoiceNumber}</Typography>
                </div>
              )
            },
            position: { x: xPosition, y: 80 * index },
            style: customNodeStyles.invoice
          });
          if (invoice?.fieldTicket) {
            invoice?.fieldTicket?.map((ft, index) => {
              const indexToRemove = allFieldTickets.indexOf(ft?.optionValue);
              if (indexToRemove > -1) {
                allFieldTickets.splice(indexToRemove, 1);
              }
              flowEdge.push({
                id: `${ft?.optionValue}__${invoice?._id}_edge_${index}`,
                source: `${ft?.optionValue}`,
                target: invoice?._id,
                arrowHeadType: 'arrow'
              });
            });
          }
        });
      }

      if (fieldServiceOrderData?.status === SERVICE_ORDER_STATUS.closed) {
        xPosition += 300;
        flow.push({
          id: `${fieldServiceOrderData?._id}_Closed`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            label: (
              <HtmlTooltip arrow placement="top" title={fieldServiceOrderData?.status}>
                <div>
                  <Typography variant="body2">{fieldServiceOrderData?.fieldServiceOrderNumber ?? fieldServiceOrderData?.fieldServiceOrderNumber}</Typography>
                  <Typography variant="subtitle2">{fieldServiceOrderData?.status ?? fieldServiceOrderData?.status}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.serviceOrderClosed
        });
        if (!invoices?.data?.data?.length && !fieldTickets?.data?.data?.length) {
          flowEdge.push({
            id: `${fieldServiceOrderData?._id}_closed_${fieldServiceOrderData?._id}_edge`,
            source: `${fieldServiceOrderData?._id}`,
            target: `${fieldServiceOrderData?._id}_Closed`,
            arrowHeadType: 'arrow'
          });
        } else {
          invoices?.data?.data?.map((invoice, index) => {
            flowEdge.push({
              id: `${invoice?._id}_to_close_${fieldServiceOrderData?._id}_edge_${index}`,
              source: `${invoice?._id}`,
              target: `${fieldServiceOrderData?._id}_Closed`,
              arrowHeadType: 'arrow'
            });
          });
          fieldTickets?.data?.data?.map((fieldTicket, index) => {
            if (allFieldTickets.indexOf(fieldTicket?._id) > -1) {
              flowEdge.push({
                id: `${fieldTicket?._id}_to_close_${fieldServiceOrderData?._id}_edge_${index}`,
                source: `${fieldTicket?._id}`,
                target: `${fieldServiceOrderData?._id}_Closed`,
                arrowHeadType: 'arrow'
              });
            }
          });
        }
      }

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastConfig.setToastConfig(err);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  const onElementClick = (event, element) => {
    if (element?.data?.ref_url && element?.data?.ref_id) {
      window.open(`${element?.data?.ref_url}/${element?.data?.ref_id}`);
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={setFullDialogueOpen}>
      <Box display="flex" flexDirection="column">
        <Box>
          <ThemeButton
            onClick={() => {
              setColorInfo(!colorInfo);
            }}
            endIcon={colorInfo ? <ExpandLess /> : <ExpandMore />}
          >
            {'Color Info'}
          </ThemeButton>
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
      <div style={fullDialogueOpen ? { height: '92vh' } : { height: '75vh' }}>
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
}

export default FieldServiceOrderView;
