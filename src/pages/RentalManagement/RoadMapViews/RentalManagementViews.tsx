import _ from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import ReactFlow, { Controls, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import {
  deliveryTicket,
  DELIVERY_TICKET_REFRENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  rentalManagement,
  RENTAL_STATUS,
  sublease
} from '../../../constants/helpers';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';

const customNodeStyles = {
  rentalJob: {
    name: 'Rental Job',
    background: '#c3d5e6',
    borderColor: '#6c89a6'
  },
  package: {
    name: 'Package',
    background: '#acdce6',
    borderColor: '#81afb8'
  },
  product: {
    name: 'Product',
    background: '#97c9bf',
    borderColor: '#70948d'
  },
  purchaseOrder: {
    name: 'Purchase Order',
    background: '#FFA500',
    borderColor: '#6c89a6'
  },
  sublease: {
    name: 'Sublease',
    background: '#ffb3c6',
    borderColor: '#d98298'
  },
  transferAsset: {
    name: 'Transfer Asset',
    background: '#ecc19c',
    borderColor: '#d98298'
  },
  productAssets: {
    name: 'Assets',
    background: '#ffd65b',
    borderColor: '#f5c431'
  },
  loadingTicket: {
    name: 'Loading Ticket',
    background: '#e6c6e6',
    borderColor: '#b38fb3'
  },
  receivingTicket: {
    name: 'Receiving Ticket',
    background: '#cfdb7f',
    borderColor: '#aeb86e'
  },
  returnTicket: {
    name: 'Return Ticket',
    background: '#ff9980',
    borderColor: '#db765c'
  }
};
const customDeliveredNodeStyle = {
  loadingTicket: {
    name: 'Loading Ticket',
    background: '#e6c6e6',
    borderColor: '#b38fb3',
    borderLeft: '10px solid #008000'
  },
  receivingTicket: {
    name: 'Receiving Ticket',
    background: '#cfdb7f',
    borderColor: '#aeb86e',
    borderLeft: '10px solid #008000'
  },
  returnTicket: {
    name: 'Return Ticket',
    background: '#ff9980',
    borderColor: '#db765c',
    borderLeft: '10px solid #FF0000'
  },
  cancelledRentalJob: {
    name: 'Return Ticket',
    background: '#00FF00',
    borderColor: '#999999'
  },
  closedRentalJob: {
    name: 'Return Ticket',
    background: '#FF0000',
    borderColor: '#999999'
  }
};

const RentalManagementViews = (props) => {
  const { rentalName, rentalId, status } = props;
  const { isOffline } = useContext(CustomOfflineContext);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [rentalName]);

  const fetchData = async () => {
    if (!isOffline) {
      const product = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
      const ticketData = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?refrenceType=${DELIVERY_TICKET_REFRENCE_TYPE.rentalJob}&refrenceId=${rentalId}`
      );
      const purchaseOrder = await axiosInstance().get(`purchase-order?filterById=[{"field":"rentalJob","term":"${rentalId}"}]`);
      const subLease = await axiosInstance().get(`${sublease.api}?filterById=[{"field":"rentalJob","term":"${rentalId}"}]`);
      const transferAsset = await axiosInstance().get(`transfer-asset?filterById=[{"field":"rentalJob","term":"${rentalId}"}]`);

      const allData = await Promise.all(
        transferAsset?.data?.data?.map((transfer) => {
          return axiosInstance()
            .get(`transfer-asset/get-asset/${transfer._id}`)
            .then((item) => {
              return { transferId: transfer._id, docs: item?.data?.data };
            });
        })
      ).then((data: any) => data);

      var allAssets = {};
      allData.map((item) => {
        item.docs?.map((data) => {
          allAssets[data.assetNumber] = item.transferId;
        });
      });

      const loadingTicket = ticketData?.data?.data?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.loading);
      const receivingTicket = ticketData?.data?.data?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.receiving);
      const returnTicket = ticketData?.data?.data?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.return);

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

      xPosition += 300;
      const allPackages = product?.data?.data?.material?.filter((item) => item.type === 'package').map((item) => item._id);
      const allPackagesAndProductIds = product?.data?.data?.material?.map((item) => item._id);
      if (allPackages.length) xPosition += 300;
      var pakcageIdx = 0;
      var productIdx = 0;
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
          position: { x: item.type === 'package' ? xPosition - 300 : xPosition, y: item.type === 'package' ? pakcageIdx * 80 : productIdx * 80 },
          style: item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        item.type === 'package' ? (pakcageIdx += 1) : (productIdx += 1);
        flowEdge.push({
          id: `edge-product-${item._id}`,
          source: `${item.parentId && allPackages.includes(item.parentId) ? item.parentId : rentalId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });

      var purchaseAndSubLeaseIdx = 0;
      if (
        purchaseOrder?.data?.data?.length ||
        subLease?.data?.data.length ||
        transferAsset?.data?.data?.length ||
        (subLease?.data?.data.length && purchaseOrder?.data?.data?.length) ||
        (transferAsset?.data?.data?.length && purchaseOrder?.data?.data?.length) ||
        (transferAsset?.data?.data?.length && purchaseOrder?.data?.data?.length && subLease?.data?.data.length)
      )
        xPosition += 300;
      const purchaseArr = purchaseOrder?.data?.data?.map((item) => item._id);
      const subLeaseArr = subLease?.data?.data?.map((item) => item.supplierAccount.optionValue);
      const purchaseOrderInAssets = product?.data?.data?.inventory
        ?.filter((item) => item.inventoryDetail.purchaseOrder)
        .map((item) => item.inventoryDetail.purchaseOrder);
      purchaseOrder?.data?.data?.map((item: any, index) => {
        if (purchaseOrderInAssets.includes(item._id)) {
          flow.push({
            id: `${item._id}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'purchaseOrder',
              ref_id: item._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.purchaseOrderNumber}</div>
            },
            position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
            style: customNodeStyles.purchaseOrder
          });
          purchaseAndSubLeaseIdx += 1;
        }
        product?.data?.data?.inventory?.map((data) => {
          if (purchaseArr.includes(data.inventoryDetail.purchaseOrder) && data.inventoryDetail.purchaseOrder === item._id) {
            flowEdge.push({
              id: `edge-purchseOrder-${item._id}-${_.random(0, 1000)}`,
              source: `${data._id}`,
              arrowHeadType: 'arrow',
              target: `${item._id}`
            });
          }
        });
      });

      const subleaseInAssets = product?.data?.data?.inventory
        ?.filter((item) => item.inventoryDetail.supplierAccount)
        .map((item) => item.inventoryDetail.supplierAccount);
      subLease?.data?.data?.map((item: any, index) => {
        if (subleaseInAssets.includes(item.supplierAccount.optionValue)) {
          flow.push({
            id: `${item.supplierAccount.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'sublease',
              ref_id: item._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subleaseName}</div>
            },
            position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
            style: customNodeStyles.sublease
          });
          purchaseAndSubLeaseIdx += 1;
        }
        product?.data?.data?.inventory?.map((data) => {
          if (
            subLeaseArr.includes(data.inventoryDetail.supplierAccount) &&
            data.inventoryDetail.supplierAccount === item.supplierAccount.optionValue
          ) {
            flowEdge.push({
              id: `edge-sublease-${item._id}-${_.random(0, 1000)}`,
              source: `${data._id}`,
              arrowHeadType: 'arrow',
              target: `${item.supplierAccount.optionValue}`
            });
          }
        });
      });

      transferAsset?.data?.data?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'transferAsset',
            ref_id: item._id,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.transferAssetNumber}</div>
          },
          position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
          style: customNodeStyles.transferAsset
        });
        purchaseAndSubLeaseIdx += 1;
        product?.data?.data?.inventory?.map((data) => {
          if (allAssets[data.inventoryDetail.assetNumber] !== undefined && allPackagesAndProductIds.includes(data.product)) {
            flowEdge.push({
              id: `edge-transfer-${data.inventoryDetail.assetNumber}-${_.random(0, 1000)}`,
              source: `${data.product}`,
              arrowHeadType: 'arrow',
              target: `${item._id}`
            });
          }
        });
      });

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

        flowEdge.push({
          id: `edge-assets-${item.inventoryDetail.assetNumber}`,
          source: purchaseArr.includes(item.inventoryDetail.purchaseOrder)
            ? `${item.inventoryDetail.purchaseOrder}`
            : subLeaseArr.includes(item.inventoryDetail.supplierAccount) && item.inventoryDetail.subleaseAsset
            ? `${item.inventoryDetail.supplierAccount}`
            : allAssets[item.inventoryDetail.assetNumber] !== undefined
            ? allAssets[item.inventoryDetail.assetNumber]
            : `${item._id}`,
          arrowHeadType: 'arrow',
          target: `${item.inventoryDetail.assetNumber}`
        });
      });

      var loadingAssets = 0;
      if (loadingTicket?.length) xPosition += 300;
      loadingTicket?.map((item: any, index) => {
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
              </div>
            )
          },
          position: { x: xPosition, y: index * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.loadingTicket : customNodeStyles.loadingTicket
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

      xPosition += 600;
      var receivingAndReturnIdx = 0;
      receivingTicket?.map((item: any) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'receiving',
            ref_id: item._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.ticketName}
                <br />
                {item.ticketType} Ticket
              </div>
            )
          },
          position: { x: xPosition, y: receivingAndReturnIdx * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.receivingTicket : customNodeStyles.receivingTicket
        });
        receivingAndReturnIdx += 1;
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-receiving-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
        });
      });
      returnTicket?.map((item: any) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'return',
            ref_id: item._id,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.ticketName}
                <br />
                {item.ticketType} Ticket
              </div>
            )
          },
          position: { x: xPosition, y: receivingAndReturnIdx * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.returnTicket : customNodeStyles.returnTicket
        });
        receivingAndReturnIdx += 1;
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-return-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
        });
      });

      if ((status === RENTAL_STATUS.cancelled || status === RENTAL_STATUS.closed) && (receivingTicket.length || returnTicket.length)) {
        xPosition += 300;
        const endRentalTicketId = '12345678900987654123456';
        flow.push({
          id: `${endRentalTicketId}`,
          type: 'output',
          className: 'dark-node',
          targetPosition: 'left',
          data: {
            ref_type: 'rentalJob',
            ref_id: rentalId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div>
          },
          position: { x: xPosition, y: 70 },
          style: RENTAL_STATUS.cancelled ? customDeliveredNodeStyle.cancelledRentalJob : customDeliveredNodeStyle.closedRentalJob
        });
        receivingTicket?.map((item: any) => {
          flowEdge.push({
            id: `edge-receiving-and-return-${item._id}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${endRentalTicketId}`
          });
        });
        returnTicket?.map((item: any) => {
          flowEdge.push({
            id: `edge-receiving-and-return-${item._id}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${endRentalTicketId}`
          });
        });
      }

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
      case 'sublease':
        history.push(`${routes.subleaseDetail.path}/${element.data.ref_id}`);
        break;
      case 'transferAsset':
        history.push(`${routes.transferAssetDetail.path}/${element.data.ref_id}`);
        break;
      default:
        history.push(`${routes.rentalManagementDetail.path}/${element.data.ref_id}?tab=2`);
    }
  };

  return (
    <div style={{ height: '68vh' }}>
      {flowData.length ? (
        <>
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
        </>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100 w-100">Loading Map...</div>
      )}
    </div>
  );
};

export default RentalManagementViews;
