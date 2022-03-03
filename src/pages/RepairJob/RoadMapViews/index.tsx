import React, { useState, useEffect } from 'react';
import ReactFlow, { Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, INVENTORY_STATUS, REPAIR_JOB_STATUS } from 'src/constants/helpers';

const customNodeStyles = {
  repairJob: {
    name: 'Repair Job',
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  asset: {
    name: 'Assets',
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  lostOrScrapAssets: {
    name: 'Lost/Scrap Assets',
    background: '#ff9980',
    borderColor: '#db765c'
  },
  loadingTicket: {
    name: 'Loading Ticket',
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  closedRepairJob: {
    name: 'Completed Repair Job',
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
        style:
          item?.status === INVENTORY_STATUS.scrap || item?.status === INVENTORY_STATUS.lost
            ? customNodeStyles.lostOrScrapAssets
            : customNodeStyles.asset
      });

      flowEdge.push({
        id: `edge-assets-${item._id}`,
        source: `${repairId}`,
        arrowHeadType: 'arrow',
        target: `${item._id}`
      });
    });

    const allTicketsAssets = assets?.data?.data?.map((asset) => {
      var assetsTicket = [];
      tickets?.data?.data?.map((t) => {
        const ticketInventory = t?.productInventory?.map((i) => i.optionValue);
        if (ticketInventory.includes(asset.inventory)) {
          const ticketData = {
            ticketId: t._id,
            ticketName: t.ticketName,
            ticketType: t.ticketType,
            inventory: asset.inventory,
            status: t.status
          };
          assetsTicket.push(ticketData);
        }
      });
      return assetsTicket;
    });

    var edgeFromTicketToClosed = [];
    allTicketsAssets?.map((i, index) => {
      i?.map((item, idx) => {
        flow.push({
          id: `${item.ticketId}-${index}-${idx}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'deliveryTicket',
            ref_id: item.ticketId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.ticketName}
                <br />
                {item.ticketType} Ticket
              </div>
            )
          },
          position: { x: xPosition + (idx + 1) * 300, y: index * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.loadingTicket : customNodeStyles.loadingTicket
        });
        flowEdge.push({
          id: `edge-asset-${item.inventory}-${item.ticketId}-${index}-${idx}`,
          source: idx === 0 ? `${item.inventory}` : `${i[idx - 1].ticketId}-${index}-${idx - 1}`,
          arrowHeadType: 'arrow',
          target: `${item.ticketId}-${index}-${idx}`
        });
      });
      var data = { target: `${i[i.length - 1].ticketId}-${index}-${i.length - 1}` };
      edgeFromTicketToClosed.push(data);
    });

    var indexData = 0;
    allTicketsAssets?.map((item) => {
      if (indexData <= item.length) {
        indexData = item.length;
      }
    });
    if (indexData !== 0) xPosition += 300 * indexData;

    if (repairStatus === REPAIR_JOB_STATUS.completed) {
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

      edgeFromTicketToClosed?.map((item, index) => {
        flowEdge.push({
          id: `edge-asset-${repairId}-${index}-closed`,
          source: `${item.target}`,
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
        break;
      case 'deliveryTicket':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
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
