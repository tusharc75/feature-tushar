import { Box, Paper, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { COLOUR_MASTER, fieldTicket, invoice, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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

function ServiceOrderViews({ serviceData }) {
  const toastConfig = useContext(CustomToastContext);
  const [colorInfo, setColorInfo] = useState(false);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchData();
  }, [serviceData._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fieldTickets = await axiosInstance().get(
        `${fieldTicket.api}?filterById=${JSON.stringify([
          {
            field: 'fieldServiceOrder',
            term: serviceData?._id
          }
        ])}`
      );
      const invoices = permissions?.invoice?.isRead && (await axiosInstance().get(`${invoice.api}?fieldServiceOrder=${serviceData?._id}`));

      var xPosition = 0;
      var flowEdge: any[] = [];
      var flow: any[] = [
        {
          id: `${serviceData?._id}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'fieldServiceOrder',
            ref_id: serviceData?._id,
            label: (
              <div>
                <Typography variant="body2">{sidebarResource?.fieldServiceOrder}</Typography>
                <Typography variant="subtitle2">{serviceData?.fieldServiceOrderNumber ?? serviceData?.fieldServiceOrderNumber}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.fieldServiceOrder
        }
      ];

      const allFieldTickets = [];
      if (fieldTickets?.data?.data?.length) {
        xPosition += 300;
        fieldTickets?.data?.data?.map((fieldTicket, index) => {
          allFieldTickets.push(fieldTicket._id);
          flow.push({
            id: `${fieldTicket?._id}`,
            type: 'default',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'fieldTicket',
              ref_id: fieldTicket?._id,
              label: (
                <div>
                  <Typography variant="body2">{'Field Ticket'}</Typography>
                  <Typography variant="subtitle2">{fieldTicket?.fieldTicketNumber ?? fieldTicket?.fieldTicketNumber}</Typography>
                </div>
              )
            },
            position: { x: xPosition, y: 80 * index },
            style: customNodeStyles.fieldTicket
          });
          flowEdge.push({
            id: `${fieldTicket?._id}__fieldTicket_edge_${index}`,
            source: `${serviceData?._id}`,
            target: `${fieldTicket?._id}`,
            arrowHeadType: 'arrow'
          });
        });
      }

      if (invoices?.data?.data?.length) {
        xPosition += 300;
        invoices?.data?.data?.map((invoice, index) => {
          flow.push({
            id: `${invoice?._id}`,
            type: 'default',
            sourcePosition: 'right',
            targetPosition: 'left',
            data: {
              ref_type: 'invoice',
              ref_id: invoice?._id,
              label: (
                <div>
                  <Typography variant="body2">{'Invoice'}</Typography>
                  <Typography variant="subtitle2">{invoice?.invoiceNumber ?? invoice?.invoiceNumber}</Typography>
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
                target: `${invoice?._id}`,
                arrowHeadType: 'arrow'
              });
            });
          }
        });
      }

      if (serviceData?.status === 'Closed') {
        xPosition += 300;
        flow.push({
          id: `${serviceData?._id}_Closed`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'received',
            ref_id: serviceData?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={serviceData?.status}>
                <div>
                  <Typography variant="body2">{serviceData?.fieldServiceOrderNumber ?? serviceData?.fieldServiceOrderNumber}</Typography>
                  <Typography variant="subtitle2">{serviceData?.status ?? serviceData?.status}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 80 },
          style: customNodeStyles.serviceOrderClosed
        });
        if (!invoices?.data?.data?.length && !fieldTickets?.data?.data?.length) {
          flowEdge.push({
            id: `${serviceData?._id}_closed_${serviceData?._id}_edge`,
            source: `${serviceData?._id}`,
            target: `${serviceData?._id}_Closed`,
            arrowHeadType: 'arrow'
          });
        } else {
          invoices?.data?.data?.map((invoice, index) => {
            flowEdge.push({
              id: `${invoice?._id}_to_close_${serviceData?._id}_edge_${index}`,
              source: `${invoice?._id}`,
              target: `${serviceData?._id}_Closed`,
              arrowHeadType: 'arrow'
            });
          });
          fieldTickets?.data?.data?.map((fieldTicket, index) => {
            // check this fieldTicket is in allFieldTickets
            if (allFieldTickets.indexOf(fieldTicket?._id) > -1) {
              flowEdge.push({
                id: `${fieldTicket?._id}_to_close_${serviceData?._id}_edge_${index}`,
                source: `${fieldTicket?._id}`,
                target: `${serviceData?._id}_Closed`,
                arrowHeadType: 'arrow'
              });
            }
          });
        }
        // allTechnician?.map((technician, index) => {
        //   flowEdge.push({
        //     id: `${technician?.technician?._id}__${serviceData?._id}_edge`,
        //     source: `${technician?.technician?._id}`,
        //     target: `${serviceData?._id}_Closed`,
        //     arrowHeadType: 'arrow'
        //   });
        // });
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
    switch (element.data.ref_type) {
      case 'purchaseOrder':
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={setFullDialogueOpen}>
      <Box marginLeft={2} marginTop={1} display="flex" flexDirection="column">
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
      <div style={fullDialogueOpen ? { height: '92vh' } : { height: '65vh' }}>
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

export default ServiceOrderViews;
