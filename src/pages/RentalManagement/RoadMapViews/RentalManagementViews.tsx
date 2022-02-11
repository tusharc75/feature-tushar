import _ from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE, rentalManagement } from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';

const customNodeStyles = {
  rentalJob: {
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  product: {
    background: '#97c9bf',
    borderColor: '#70948d'
  },
  productAssets: {
    background: '#9CA8B3',
    borderColor: '#f5c431'
  },
  loadingTicket: {
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  loadingAssets: {
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  receivingTicket: {
    background: '#cfdb7f',
    borderColor: '#aeb86e'
  }
};

const RentalManagementViews = (props) => {
  const { rentalName, rentalId } = props;
  const { isOffline } = useContext(CustomOfflineContext);
  const [flowData, setFlowData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [rentalName]);

  const fetchData = async () => {
    if (!isOffline) {
      var flow: any[] = [
        {
          id: `${rentalId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: { label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div> },
          position: { x: 0, y: 70 },
          style: customNodeStyles.rentalJob
        }
      ];
      var flowEdge: any[] = [];
      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
      response?.data?.data?.material?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productDetail.productName}
                <br />
                {item.type}
              </div>
            )
          },
          position: { x: 300, y: index * 80 },
          style: customNodeStyles.product
        });
        flowEdge.push({
          id: `edge-${item._id}`,
          source: `${rentalId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
          // animated: true
        });
      });
      response?.data?.data?.inventory?.map((item: any, index) => {
        flow.push({
          id: `${item.inventoryDetail.assetNumber}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.inventoryDetail.assetNumber}</div>
          },
          position: { x: 600, y: index * 80 },
          style: customNodeStyles.productAssets
        });
        flowEdge.push({
          id: `edge-${item.inventoryDetail.assetNumber}`,
          source: `${item._id}`,
          arrowHeadType: 'arrow',
          target: `${item.inventoryDetail.assetNumber}`
          // animated: true
        });
      });
      const loadingTicketData = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalId}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );
      loadingTicketData?.data?.data?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.ticketName}
                <br />
                {item.ticketType} Ticket
                <br />
                {item.status}
              </div>
            )
          },
          position: { x: 900, y: index * 80 },
          style: customNodeStyles.loadingTicket
        });

        item.productInventory?.map((product: any, productIndex) => {
          flow.push({
            id: `${product.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: { label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.optionLabel}</div> },
            position: { x: 1200, y: (productIndex + index) * 80 },
            style: customNodeStyles.loadingAssets
          });
          flowEdge.push({
            id: `edge-${item._id}`,
            source: `${product.optionLabel}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
            // animated: true
          });
          flowEdge.push({
            id: `edge-${product.optionValue}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${product.optionValue}`
            // animated: true
          });
        });
      });
      const receivingTicketData = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalId}&ticketType=${DELIVERY_TICKET_TYPE.receiving}`
      );
      receivingTicketData?.data?.data?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'output',
          data: {
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.ticketName}
                <br />
                {item.ticketType} Ticket
                <br />
                {item.status}
              </div>
            )
          },
          position: { x: 1400, y: index * 80 },
          style: customNodeStyles.receivingTicket
        });
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
            // animated: true
          });
        });
      });

      setFlowData([...flow, ...flowEdge]);
    } else {
      setFlowData([
        {
          id: `${rentalId}`,
          type: 'input',
          //   className: 'dark-node',
          sourcePosition: 'right',
          data: { label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName}</div> },
          position: { x: 0, y: 80 },
          style: customNodeStyles.rentalJob
        }
      ]);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  return (
    <div style={{ height: '68vh' }}>
      {flowData.length ? (
        <ReactFlow
          elements={flowData || []}
          onLoad={onLoad}
          selectNodesOnDrag={false}
          snapToGrid={true}
          snapGrid={[15, 15]}
          aria-controls="right-panel"
          // onNodeMouseEnter={onNodeMouseEnter}
          // onNodeMouseMove={onNodeMouseMove}
          // onNodeMouseLeave={onNodeMouseLeave}
          // onNodeContextMenu={onNodeContextMenu}
        >
          <Controls />
        </ReactFlow>
      ) : null}
    </div>
  );
};

export default RentalManagementViews;
