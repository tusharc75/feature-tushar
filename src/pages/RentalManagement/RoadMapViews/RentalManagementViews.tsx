import _ from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import ReactFlow, { Controls } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { deliveryTicket, DELIVERY_TICKET_REFRENCE_TYPE, DELIVERY_TICKET_TYPE, rentalManagement, purchaseOrder } from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';

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
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  loadingTicket: {
    background: '#e6c6e6',
    borderColor: '#b38fb3'
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
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [rentalName]);

  const fetchData = async () => {
    if (!isOffline) {
      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${rentalId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'rentalJob',
            ref_id: rentalId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div>
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.rentalJob
        }
      ];
      var flowEdge: any[] = [];
      const product = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
      xPosition += 300;
      const allPackages = product?.data?.data?.material?.filter((item) => item.type === 'package').map((item) => item._id);
      if (allPackages.length) xPosition += 300;

      product?.data?.data?.material?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: item.type,
            ref_id: item.materialId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productDetail?.productName || item.packageDetail?.packageName}
                <br />
                {_.startCase(_.camelCase(item.type))}
              </div>
            )
          },
          position: { x: item.type === 'package' ? xPosition - 300 : xPosition, y: index * 80 },
          style: customNodeStyles.product
        });
        flowEdge.push({
          id: `edge-product-${item._id}`,
          source: `${item.parentId && allPackages.includes(item.parentId) ? item.parentId : rentalId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });
      // const purchaseArr = new Map();
      // const purchaseOrder = await axiosInstance().get(`purchase-order?filterById=[{"field":"rentalJob","term":"${rentalId}"}]`);
      // purchaseOrder?.data?.data?.map((item) => {
      //   purchaseArr.set(`${item._id}`, `${item._id}`);
      // });
      // purchaseOrder?.data?.data?.map((item: any, index) => {
      //   flow.push({
      //     id: `${item._id}`,
      //     sourcePosition: 'right',
      //     targetPosition: 'left',
      //     type: 'default',
      //     data: {
      //       ref_type: 'purchaseOrder',
      //       ref_id: item._id,
      //       label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.purchaseOrderNumber}</div>
      //     },
      //     position: { x: 900, y: index * 80 },
      //     style: customNodeStyles.product
      //   });
      //   flowEdge.push({
      //     id: `edge-purchseOrder-${item._id}`,
      //     source: `${rentalId}`,
      //     arrowHeadType: 'arrow',
      //     target: `${item._id}`
      //   });
      // });
      xPosition += 300;
      product?.data?.data?.inventory?.map((item: any, index) => {
        flow.push({
          id: `${item.inventoryDetail.assetNumber}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'asset',
            ref_id: item.inventory,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.inventoryDetail.assetNumber}</div>
          },
          position: { x: xPosition, y: index * 80 },
          style: customNodeStyles.productAssets
        });
        // purchaseArr.get(`${item.inventoryDetail.purchaseOrder}`) ? item.inventoryDetail.purchaseOrder :
        flowEdge.push({
          id: `edge-assets-${item.inventoryDetail.assetNumber}`,
          source: `${item._id}`,
          arrowHeadType: 'arrow',
          target: `${item.inventoryDetail.assetNumber}`
        });
      });
      const loadingTicketData = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalId}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );
      var loadingAssets = 0;
      if (loadingTicketData?.data?.data?.length) xPosition += 300;
      loadingTicketData?.data?.data?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'loading',
            ref_id: item._id,
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
          position: { x: xPosition, y: index * 80 },
          style: customNodeStyles.loadingTicket
        });

        item.productInventory?.map((product: any, productIndex) => {
          flow.push({
            id: `${product.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'asset',
              ref_id: product.optionValue,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.optionLabel}</div>
            },
            position: { x: xPosition + 300, y: loadingAssets * 80 },
            style: customNodeStyles.productAssets
          });
          loadingAssets += 1;
          flowEdge.push({
            id: `edge-loading-${item._id}-${product.optionValue}`,
            source: `${product.optionLabel}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
          flowEdge.push({
            id: `edge-loading-assets-${product.optionValue}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${product.optionValue}`
          });
        });
      });
      const receivingTicketData = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalId}&ticketType=${DELIVERY_TICKET_TYPE.receiving}`
      );
      xPosition += 600;
      receivingTicketData?.data?.data?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'output',
          data: {
            ref_type: 'receiving',
            ref_id: item._id,
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
          position: { x: xPosition, y: index * 80 },
          style: customNodeStyles.receivingTicket
        });
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-receiving-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
        });
      });

      setFlowData([...flow, ...flowEdge]);
    } else {
      setFlowData([
        {
          id: `${rentalId}`,
          type: 'input',
          sourcePosition: 'right',
          data: {
            ref_type: 'rentalJob',
            ref_id: rentalId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div>
          },
          position: { x: 0, y: 80 },
          style: customNodeStyles.rentalJob
        }
      ]);
    }
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'product':
        history.push(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        history.push(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'loading':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'receiving':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'purchaseOrder':
        history.push(`${routes.purchaseOrderDetail.path}/${element.data.ref_id}`);
        break;
      default:
        history.push(`${routes.rentalManagementDetail.path}/${element.data.ref_id}?tab=2`);
    }
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
          onElementClick={onElementClick}
        >
          <Controls />
        </ReactFlow>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100 w-100">Loading Map...</div>
      )}
    </div>
  );
};

export default RentalManagementViews;
