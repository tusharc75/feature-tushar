import _ from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE, rentalManagement } from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';

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
          data: { label: rentalName ?? rentalName },
          position: { x: 0, y: 20 }
        }
      ];
      var flowEdge: any[] = [];
      const response = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/productpackage/${rentalId}`);
      response?.data?.data?.material?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: { label: item.productDetail.productName },
          position: { x: 300, y: index * 20 }
        });
        flowEdge.push({
          id: `edge-${item._id}`,
          source: `${rentalId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });
      response?.data?.data?.inventory?.map((item: any, index) => {
        flow.push({
          id: `${item.inventoryDetail.assetNumber}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: { label: item.inventoryDetail.assetNumber },
          position: { x: 600, y: index * 40 }
        });
        flowEdge.push({
          id: `edge-${item.inventoryDetail.assetNumber}`,
          source: `${item._id}`,
          arrowHeadType: 'arrow',
          target: `${item.inventoryDetail.assetNumber}`
          //   animated: true
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
          data: { label: item.ticketName },
          position: { x: 900, y: index * 40 }
        });

        item.productInventory?.map((product: any, productIndex) => {
          flow.push({
            id: `${product.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: { label: product.optionLabel },
            position: { x: 1200, y: productIndex * 40 }
          });
          flowEdge.push({
            id: `edge-${item._id}`,
            source: `${product.optionLabel}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
            //   animated: true
          });
          flowEdge.push({
            id: `edge-${product.optionValue}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${product.optionValue}`
            //   animated: true
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
          data: { label: item.ticketName },
          position: { x: 1400, y: index * 40 }
        });
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
            //   animated: true
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
          data: { label: rentalName },
          position: { x: 0, y: 80 }
        }
      ]);
    }
  };

  //   const initialElements: Elements<any> | any = [
  //     {
  //       id: 'horizontal-1',
  //       type: 'input',
  //       className: 'dark-node',
  //       sourcePosition: 'right',
  //       data: { label: rentalName },
  //       position: { x: 0, y: 80 }
  //     },
  //     {
  //       id: 'horizontal-2',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'A Node' },
  //       position: { x: 250, y: 0 }
  //     },
  //     {
  //       id: 'horizontal-3',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 3' },
  //       position: { x: 250, y: 160 }
  //     },
  //     {
  //       id: 'horizontal-4',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 4' },
  //       position: { x: 500, y: 0 }
  //     },
  //     {
  //       id: 'horizontal-5',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 5' },
  //       position: { x: 500, y: 100 }
  //     },
  //     {
  //       id: 'horizontal-6',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 6' },
  //       position: { x: 500, y: 230 }
  //     },
  //     {
  //       id: 'horizontal-7',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 7' },
  //       position: { x: 750, y: 50 }
  //     },
  //     {
  //       id: 'horizontal-8',
  //       source: 'right',
  //       sourcePosition: 'right',
  //       targetPosition: 'left',
  //       data: { label: 'Node 8' },
  //       position: { x: 750, y: 300 }
  //     },
  //     {
  //       id: 'horizontal-e1-2',
  //       source: 'horizontal-1',
  //       type: 'default',
  //       target: 'horizontal-2'
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e1-3',
  //       source: 'horizontal-1',
  //       type: 'default',
  //       target: 'horizontal-3'
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e1-4',
  //       source: 'horizontal-2',
  //       type: 'default',
  //       target: 'horizontal-4'
  //       // label: "edge label"
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e3-5',
  //       source: 'horizontal-3',
  //       type: 'default',
  //       target: 'horizontal-5'
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e3-6',
  //       source: 'horizontal-3',
  //       type: 'default',
  //       target: 'horizontal-6'
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e5-7',
  //       source: 'horizontal-5',
  //       type: 'default',
  //       target: 'horizontal-7'
  //       // animated: true
  //     },
  //     {
  //       id: 'horizontal-e6-8',
  //       source: 'horizontal-5',
  //       type: 'default',
  //       target: 'horizontal-8'
  //       // animated: true
  //     }
  //   ];
  // write a style for the node

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
