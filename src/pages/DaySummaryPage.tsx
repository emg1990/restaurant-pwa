import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
} from '@mui/material';
import { getOrdersByDate, finalizeDay } from '../services/db';
import type { Order, PaymentMethod } from '../models/types';
import { useNavigate } from 'react-router-dom';

const DaySummaryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const navigate = useNavigate();

  const load = async (date?: string) => {
    setLoading(true);
    const dayToLoad = date ?? selectedDate;
    const todays = await getOrdersByDate(dayToLoad);
    // sort by orderNumber
    todays.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
    setOrders(todays);
    setLoading(false);
  };

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  const totals = orders.reduce(
    (acc, o) => {
      acc.total += o.totalAmount;
      const pm: PaymentMethod = o.paymentMethod;
      if (pm === 'CASH') acc.cash += o.totalAmount;
      else if (pm === 'QR_CODE') acc.qr += o.totalAmount;
      else if (pm === 'CARD') acc.card += o.totalAmount;
      else acc.other += o.totalAmount;
      // order type breakdown
      const ot = o.orderType;
      if (ot === 'EAT_IN') {
        acc.eatIn.total += o.totalAmount;
        acc.eatIn.count += 1;
      } else if (ot === 'TO_GO') {
        acc.toGo.total += o.totalAmount;
        acc.toGo.count += 1;
      }
      acc.count += 1;
      return acc;
    },
    { total: 0, cash: 0, qr: 0, card: 0, other: 0, count: 0, eatIn: { total: 0, count: 0 }, toGo: { total: 0, count: 0 } } as any
  );

  const handleFinalize = async () => {
    await finalizeDay(selectedDate);
    setConfirmOpen(false);
    await load(selectedDate);
    alert(`Day ${selectedDate} finalized and archived.`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Day Summary</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button variant="contained" size="small" sx={{ ml: 1 }} onClick={() => load(selectedDate)}>Refresh</Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Paper sx={{ p: 2, minWidth: 160, flex: '0 0 180px' }}>
          <Typography variant="subtitle2">Orders</Typography>
          <Typography variant="h6">{totals.count}</Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: '1 1 320px' }}>
          <Typography variant="subtitle2">Total revenue</Typography>
          <Typography variant="h5">${totals.total.toFixed(2)}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption">Cash</Typography>
              <Typography>${totals.cash.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">QR</Typography>
              <Typography>${totals.qr.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Card</Typography>
              <Typography>${totals.card.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Other</Typography>
              <Typography>${totals.other.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Paper>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 160 }}>
              <Typography variant="subtitle2">Eat in</Typography>
              <Typography variant="h6">${(totals.eatIn.total ?? 0).toFixed(2)}</Typography>
              <Typography variant="caption">Orders: {totals.eatIn.count ?? 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 160 }}>
              <Typography variant="subtitle2">To go</Typography>
              <Typography variant="h6">${(totals.toGo.total ?? 0).toFixed(2)}</Typography>
              <Typography variant="caption">Orders: {totals.toGo.count ?? 0}</Typography>
            </Paper>
          </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Orders (preview)</Typography>
          {orders.length === 0 ? (
          <Typography>No orders today.</Typography>
        ) : (
          orders.map((o) => {
            const isPending = o.status !== 'COMPLETED';
            return (
              <Paper
                key={o.id}
                sx={{
                  p: 2,
                  mb: 1,
                  borderLeft: isPending ? '4px solid' : undefined,
                  borderColor: isPending ? 'error.main' : undefined,
                  bgcolor: isPending ? 'rgba(244,67,54,0.06)' : undefined,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 'bold' }}>#{o.orderNumber} — {o.shortId}</Typography>
                    <Typography variant="body2">${o.totalAmount.toFixed(2)} — {new Date(o.createdAt).toLocaleTimeString()}</Typography>
                  </Box>
                  <Box>
                    <Button size="small" onClick={() => navigate(`/order/print/${o.id}`)}>Open</Button>
                  </Box>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>Finalize day</Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Finalize day</DialogTitle>
        <DialogContent>
          <Typography>Finalizing will reset the order number counter to 0 for today. This cannot be undone. Are you sure?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleFinalize}>Yes, finalize</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DaySummaryPage;
