import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, List, ListItem, Button, Divider, Chip } from '@mui/material';
import { getOrdersByDate, updateOrder } from '../services/db';
import { formatTime } from '../lib/date';
import type { Order } from '../models/types';
import { useNavigate } from 'react-router-dom';

const OrdersTodayPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const todays = await getOrdersByDate();
    // sort by orderNumber or createdAt
    todays.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
    setOrders(todays);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (o: Order) => {
    if (o.status === 'COMPLETED') return;
    const updated = { ...o, status: 'COMPLETED' } as Order;
    await updateOrder(updated);
    await load();
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Today's Orders</Typography>
        <Box>
          <Button variant="outlined" size="small" onClick={() => navigate('/')}>Home</Button>
          <Button variant="contained" size="small" sx={{ ml: 1 }} onClick={load}>Refresh</Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Typography>Loading...</Typography>
      ) : orders.length === 0 ? (
        <Typography>No orders for today.</Typography>
      ) : (
        <List>
          {orders.map((o) => {
            const desc = o.items
              .map((it) => `${it.quantity}x ${it.name}`)
              .slice(0, 3)
              .join(', ');

            const more = o.items.length > 3 ? ` (+${o.items.length - 3} more)` : '';

            return (
              <ListItem key={o.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/order/print/${o.id}`)}>
                  <Typography sx={{ fontWeight: 'bold' }}>#{o.orderNumber} — {o.shortId}</Typography>
                  <Typography variant="body2">{desc}{more}</Typography>
                  <Typography variant="caption" color="text.secondary">${o.totalAmount.toFixed(2)} — {formatTime(o.createdAt)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={o.status} color={o.status === 'COMPLETED' ? 'success' : 'warning'} />
                  {o.status !== 'COMPLETED' && (
                    <Button variant="contained" size="small" onClick={() => markPaid(o)}>Mark as paid</Button>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Container>
  );
};

export default OrdersTodayPage;
