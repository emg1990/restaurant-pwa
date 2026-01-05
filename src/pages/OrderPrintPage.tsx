import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Divider } from '@mui/material';
import { getOrder, updateOrder } from '../services/db';
import type { Order } from '../models/types';
import { QRCodeSVG } from 'qrcode.react';
import { printOrder } from './OrderPrintTemplate';
import { formatDateTime } from '../lib/date';

const OrderPrintPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const o = await getOrder(orderId);
      if (!o) {
        // if order not found, navigate home
        navigate('/');
        return;
      }
      setOrder(o);
    })();
  }, [orderId, navigate]);

  if (!order) return null;

  const handlePrint = () => {
    printOrder(order);
  };

  const handleMarkPaid = async () => {
    if (!order) return;
    if (order.status === 'COMPLETED') return;
    const updated: Order = { ...order, status: 'COMPLETED' };
    await updateOrder(updated);
    setOrder(updated);
  };

  return (
    <Container maxWidth="sm" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Back</Button>
        <Typography variant="h5">Order Details</Typography>
        <Box>
          <Button variant="contained" size="small" sx={{ ml: 1 }} onClick={handlePrint}>Print</Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Order ID: {order.shortId}</Typography>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>Order #: {order.orderNumber}</Typography>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>Date: {formatDateTime(order.createdAt)}</Typography>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>Type: {order.orderType === 'TO_GO' ? 'To go' : 'Eat in'}</Typography>
  {order.table && <Typography variant="subtitle1" sx={{ mb: 1 }}>Table: {order.table}</Typography>}
      <Typography variant="subtitle2" sx={{ mb: 2 }}>Status: {order.status}</Typography>

      <Box sx={{ mb: 2 }}>
        {order.items.map((it) => (
          <Box key={it.itemId} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography>{it.name} x{it.quantity}</Typography>
            <Typography>${(it.unitPrice * it.quantity).toFixed(2)}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6">${order.totalAmount.toFixed(2)}</Typography>
      </Box>

      {order.paymentMethod === 'QR_CODE' && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>Scan to pay</Typography>
          <QRCodeSVG value={JSON.stringify({ orderId: order.shortId, amount: order.totalAmount })} width={200} height={200} />
        </Box>
      )}

      {order.status !== 'COMPLETED' &&
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            color="success"
            sx={{ ml: 1, transform: 'scale(2)', my: 2 }}
            onClick={handleMarkPaid}
          >
            Mark as paid
          </Button>
        </Box>}
    </Container>
  );
};

export default OrderPrintPage;
