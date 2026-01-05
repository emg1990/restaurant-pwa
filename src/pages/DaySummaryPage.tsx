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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { getOrdersByDate, finalizeDay, getAllItems, getAllCategories } from '../services/db';
import { formatTime } from '../lib/date';
import { localYYYYMMDD } from '../lib/date';
import type { Order, PaymentMethod } from '../models/types';
import { useNavigate } from 'react-router-dom';

const DaySummaryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const today = localYYYYMMDD();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const navigate = useNavigate();

  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

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

  useEffect(() => {
    (async () => {
      const items = await getAllItems();
      const cats = await getAllCategories();
      setCatalogItems(items || []);
      setCategories((cats || []).sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    })();
  }, []);

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

  // aggregate items sold today (by itemId and unitPrice so edited prices are separated) and attach categoryId
  const aggregatedItems = React.useMemo(() => {
    const map = new Map<string, { itemId: string; name: string; unitPrice: number; quantity: number; total: number; categoryId?: string }>();
    for (const o of orders) {
      for (const it of o.items) {
        const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
        const key = `${it.itemId}::${priceKey}`;
        const existing = map.get(key);
        const lineTotal = (it.unitPrice ?? 0) * (it.quantity ?? 0);
        if (existing) {
          existing.quantity += it.quantity;
          existing.total += lineTotal;
        } else {
          const catalog = catalogItems.find((c) => c.id === it.itemId);
          map.set(key, { itemId: it.itemId, name: it.name, unitPrice: it.unitPrice, quantity: it.quantity, total: lineTotal, categoryId: catalog?.categoryId });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [orders, catalogItems]);

  const itemsByCategory = React.useMemo(() => {
    const grouped = new Map<string, typeof aggregatedItems>();
    for (const it of aggregatedItems) {
      const cat = it.categoryId ?? 'uncategorized';
      if (!grouped.has(cat)) grouped.set(cat, [] as any);
      grouped.get(cat)!.push(it);
    }
    return grouped;
  }, [aggregatedItems]);

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
            {/* Items sold summary grouped by category */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Items sold today</Typography>
              {aggregatedItems.length === 0 ? (
                <Typography>No items sold.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {categories.map((cat) => {
                    const catId = cat.id;
                    const bucket = itemsByCategory.get(catId);
                    if (!bucket || bucket.length === 0) return null;
                    return (
                      <Paper key={catId} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>{cat.name}</Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item</TableCell>
                              <TableCell>Unit Price</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bucket.map((it) => (
                              <TableRow key={`${it.itemId}-${it.unitPrice}`}>
                                <TableCell>{it.name}</TableCell>
                                <TableCell>${(it.unitPrice ?? 0).toFixed(2)}</TableCell>
                                <TableCell>{it.quantity}</TableCell>
                                <TableCell>${it.total.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Paper>
                    );
                  })}

                  {/* uncategorized */}
                  {itemsByCategory.get('uncategorized') && (
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Uncategorized</Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {itemsByCategory.get('uncategorized')!.map((it) => (
                            <TableRow key={`${it.itemId}-${it.unitPrice}`}>
                              <TableCell>{it.name}</TableCell>
                              <TableCell>${(it.unitPrice ?? 0).toFixed(2)}</TableCell>
                              <TableCell>{it.quantity}</TableCell>
                              <TableCell>${it.total.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  )}
                </Box>
              )}
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
                    <Typography variant="body2">${o.totalAmount.toFixed(2)} — {formatTime(o.createdAt)}</Typography>
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
