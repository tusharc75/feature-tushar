import React, { useState, useEffect } from 'react';
import ReactFlow, { Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, REPAIR_JOB_STATUS } from 'src/constants/helpers';

const customNodeStyles = {
  repairJob: {
    name: 'Rental Job',
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  asset: {
    name: 'Assets',
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  loadingTicket: {
    name: 'Loading Ticket',
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  closedRepairJob: {
    name: 'Return Ticket',
    background: '#4BB543',
    borderColor: '#999999'
  }
};
const customDeliveredNodeStyle = {
  loadingTicket: {
    name: 'Loading Ticket',
    background: '#e6c6e6',
    borderColor: '#b38fb3',
    borderLeft: '10px solid #008000'
  }
};

const RepairJobViews = (props) => {
  const { repairJobName, repairId, repairStatus } = props;

  const [flowData, setFlowData] = useState([]);
  const history = useHistory();

  useEffect(() => {
    fetchViewsData();
  }, [repairJobName]);

  async function fetchViewsData() {
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
          label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repairJobName ?? repairJobName}</div>
        },
        position: { x: xPosition, y: 70 },
        style: customNodeStyles.repairJob
      }
    ];
    var flowEdge: any[] = [];

    const assets = await axiosInstance().get(`repair-job/${repairId}/assets`);
    const tickets = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.repairJob}&refrenceId=${repairId}`
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
          label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.assetNumber}</div>
        },
        position: { x: xPosition, y: index * 80 },
        style: customNodeStyles.asset
      });

      flowEdge.push({
        id: `edge-assets-${item._id}`,
        source: `${repairId}`,
        arrowHeadType: 'arrow',
        target: `${item._id}`
      });
    });

    if (tickets?.data?.data?.length) xPosition += 300;
    tickets?.data?.data?.map((item, index) => {
      flow.push({
        id: `${item._id}`,
        sourcePosition: 'right',
        targetPosition: 'left',
        type: 'default',
        data: {
          ref_type: 'deliveryTicket',
          ref_id: item._id,
          label: (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.ticketName}
              <br />
              {item.ticketType} Ticket
            </div>
          )
        },
        position: { x: xPosition, y: index * 80 },
        style: item.status === 'Delivered' ? customDeliveredNodeStyle.loadingTicket : customNodeStyles.loadingTicket
      });
      item?.productInventory?.map((i) => {
        flowEdge.push({
          id: `edge-asset-${item._id}-${i.optionValue}`,
          source: `${i.optionValue}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });
    });
    if (repairStatus == REPAIR_JOB_STATUS.completed) {
      xPosition += 300;
      flow.push({
        id: `${repairId}-closed`,
        type: 'output',
        className: 'dark-node',
        targetPosition: 'left',
        data: {
          ref_type: 'repairJob',
          ref_id: repairId,
          label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repairJobName ?? repairJobName}</div>
        },
        position: { x: xPosition, y: 70 },
        style: customNodeStyles.closedRepairJob
      });
      tickets?.data?.data?.map((item) => {
        flowEdge.push({
          id: `edge-asset-${item._id}-closed`,
          source: `${item._id}`,
          arrowHeadType: 'arrow',
          target: `${repairId}-closed`
        });
      });
    }
    setFlowData([...flow, ...flowEdge]);
  }

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };
  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'repairJob':
        history.push(`${routes.repairJobDetail.path}/${element.data.ref_id}`);
        break;
      case 'deliveryTicket':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      default:
        history.push(`${routes.rentalManagementDetail.path}/${element.data.ref_id}?tab=2`);
    }
  };

  return (
    <div style={{ height: '57vh' }}>
      {flowData.length ? (
        <ReactFlowProvider>
          <ReactFlow
            elements={flowData || []}
            onLoad={onLoad}
            selectNodesOnDrag={false}
            snapToGrid={true}
            snapGrid={[15, 15]}
            onElementClick={onElementClick}
          >
            <div
              className="d-flex justify-content-space-between"
              style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto', marginTop: '10px' }}
            >
              {Object.keys(customNodeStyles).map((key) => {
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {customNodeStyles[key].name}
                    <div
                      style={{
                        height: '12px',
                        width: '12px',
                        marginLeft: '3px',
                        borderRadius: '100%',
                        background: `${customNodeStyles[key].background}`,
                        borderColor: `1px solid ${customNodeStyles[key].borderColor}`
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100 w-100">Loading Map...</div>
      )}
    </div>
  );
};
export default RepairJobViews;
