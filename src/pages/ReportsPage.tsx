import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, FormControl, InputLabel, Select, MenuItem as MuiMenuItem } from '@mui/material';
import { getReportsInRange, getAllItems, getAllCategories } from '../services/db';
import type { MenuItem as MenuItemType, Category } from '../models/types';

const ReportsPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reports, setReports] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('');
  const [metric, setMetric] = useState<'total' | 'quantity'>('total');

  const load = async () => {
    if (!startDate || !endDate) return;
    const rs = await getReportsInRange(startDate, endDate);
    // flatten runs: each report may have runs array
    const flattened: any[] = [];
    for (const r of rs) {
      if (r.runs && Array.isArray(r.runs)) {
        r.runs.forEach((run: any, idx: number) => flattened.push({ date: r.date, runIndex: idx, ...run }));
      } else {
        // legacy single-run object
        flattened.push({ date: r.date, ...r });
      }
    }
    setReports(flattened);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      const items = await getAllItems();
      setAllItems(items || []);
      const cats = await getAllCategories();
      setCategories(cats || []);
    })();
  }, []);

  const generateCSV = () => {
    // aggregate items across selected reports (reports array now flattened runs)
  const itemsMap = new Map<string, { name: string; quantity: number; total: number; unitPrice?: number }>();
    let grandTotal = 0;
    let orderCount = 0;
    for (const r of reports) {
      // if an orderType filter is set, aggregate only items from orders matching that type
      if (selectedOrderType) {
        for (const ord of r.orders || []) {
          if (ord.orderType !== selectedOrderType) continue;
          orderCount += 1;
          grandTotal += ord.totalAmount || 0;
          for (const it of ord.items || []) {
            const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
            const key = `${it.itemId}::${priceKey}`;
            const existing = itemsMap.get(key);
            const itTotal = (it.unitPrice ?? 0) * (it.quantity ?? 0);
            if (existing) {
              existing.quantity += it.quantity;
              existing.total += itTotal;
            } else {
              itemsMap.set(key, { name: it.name, quantity: it.quantity, total: itTotal, unitPrice: it.unitPrice });
            }
          }
        }
      } else {
        orderCount += r.orderCount || 0;
        grandTotal += r.total || 0;
        for (const it of r.items || []) {
          // include unitPrice in key so edited prices are treated as distinct rows
          const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
          const key = `${it.itemId}::${priceKey}`;
          const existing = itemsMap.get(key);
          if (existing) {
            existing.quantity += it.quantity;
            existing.total += it.total;
          } else {
            itemsMap.set(key, { name: it.name, quantity: it.quantity, total: it.total, unitPrice: it.unitPrice });
          }
        }
      }
    }

    const rows = Array.from(itemsMap.values());
    const header = ['Name', 'Quantity', 'Unit Price', 'Total'];
    const csv = [header.join(',')];
    for (const r of rows) {
      csv.push([`"${r.name}"`, r.quantity, r.unitPrice ?? '', (r.total ?? 0).toFixed(2)].join(','));
    }
    csv.push([] as any);
    csv.push([`"Orders","${orderCount}"`].join(','));
    csv.push([`"Grand Total","${grandTotal.toFixed(2)}"`].join(','));

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // aggregated items for table and filtering
  const aggregatedItems = React.useMemo(() => {
  const itemsMap = new Map<string, { itemId?: string; name: string; unitPrice?: number; quantity: number; total: number; categoryId?: string }>();
    for (const r of reports) {
      if (selectedOrderType) {
        // aggregate from per-order items when orderType filter is active
        for (const ord of r.orders || []) {
          if (ord.orderType !== selectedOrderType) continue;
          for (const it of ord.items || []) {
            if (selectedItem && it.itemId !== selectedItem) continue;
            if (selectedCategory) {
              const catalog = allItems.find((a) => a.id === it.itemId);
              if (!catalog || catalog.categoryId !== selectedCategory) continue;
            }
            const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
            const key = `${it.itemId}::${priceKey}`;
            const existing = itemsMap.get(key);
            const itTotal = (it.unitPrice ?? 0) * (it.quantity ?? 0);
            if (existing) {
              existing.quantity += it.quantity;
              existing.total += itTotal;
            } else {
              const catalog = allItems.find((a) => a.id === it.itemId);
              itemsMap.set(key, { itemId: it.itemId, name: it.name, unitPrice: it.unitPrice, quantity: it.quantity, total: itTotal, categoryId: catalog?.categoryId });
            }
          }
        }
      } else {
        for (const it of r.items || []) {
          if (selectedItem && it.itemId !== selectedItem) continue;
          if (selectedCategory) {
            const catalog = allItems.find((a) => a.id === it.itemId);
            if (!catalog || catalog.categoryId !== selectedCategory) continue;
          }
          const priceKey = it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '';
          const key = `${it.itemId}::${priceKey}`;
          const existing = itemsMap.get(key);
          if (existing) {
            existing.quantity += it.quantity;
            existing.total += it.total ?? (it.unitPrice * it.quantity);
          } else {
            const catalog = allItems.find((a) => a.id === it.itemId);
            itemsMap.set(key, { itemId: it.itemId, name: it.name, unitPrice: it.unitPrice, quantity: it.quantity, total: it.total ?? (it.unitPrice * it.quantity), categoryId: catalog?.categoryId });
          }
        }
      }
    }
    return Array.from(itemsMap.values()).sort((a, b) => b.total - a.total);
  }, [reports, selectedItem, selectedCategory, allItems, selectedOrderType]);

  // chart data: totals per date, respecting filters and metric
  const chartData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      let value = 0;
      if (selectedOrderType) {
        // sum only items inside orders of the selected type
        for (const ord of r.orders || []) {
          if (ord.orderType !== selectedOrderType) continue;
          for (const it of ord.items || []) {
            if (selectedItem && it.itemId !== selectedItem) continue;
            if (selectedCategory) {
              const catalog = allItems.find((a) => a.id === it.itemId);
              if (!catalog || catalog.categoryId !== selectedCategory) continue;
            }
            value += metric === 'total' ? ((it.unitPrice ?? 0) * (it.quantity ?? 0)) : (it.quantity ?? 0);
          }
        }
      } else if (selectedItem || selectedCategory) {
        for (const it of r.items || []) {
          if (selectedItem && it.itemId !== selectedItem) continue;
          if (selectedCategory) {
            const catalog = allItems.find((a) => a.id === it.itemId);
            if (!catalog || catalog.categoryId !== selectedCategory) continue;
          }
          value += metric === 'total' ? (it.total ?? (it.unitPrice * it.quantity)) : (it.quantity ?? 0);
        }
      } else {
        value = metric === 'total' ? (r.total ?? 0) : (r.items || []).reduce((s: number, it: any) => s + (it.quantity ?? 0), 0);
      }
      map.set(r.date, (map.get(r.date) || 0) + value);
    }
    const arr = Array.from(map.entries()).map(([date, value]) => ({ date, value }));
    arr.sort((a, b) => a.date.localeCompare(b.date));
    return arr;
  }, [reports, selectedItem, selectedCategory, metric, allItems]);

  const Chart: React.FC = () => {
    const width = 700;
    const height = 240;
    const padding = 40;
    const data = chartData;
    const max = Math.max(...data.map(d => d.value), 1);
    const barWidth = data.length ? (width - padding * 2) / data.length : 0;
    return (
      <svg width={width} height={height} style={{ width: '100%', maxWidth: width }}>
        <g transform={`translate(${padding},${padding})`}>
          {data.map((d, i) => {
            const h = ( (height - padding * 2) * d.value) / max;
            const x = i * barWidth + 4;
            const y = (height - padding * 2) - h;
            return (
              <g key={d.date}>
                <rect x={x} y={y} width={Math.max(barWidth - 8, 6)} height={h} fill="#1976d2" />
                <text x={x + (barWidth - 8) / 2} y={(height - padding * 2) + 14} fontSize={10} textAnchor="middle">{d.date}</text>
                <text x={x + 4} y={y - 4} fontSize={10}>{d.value.toFixed(2)}</text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Reports</Typography>
        <Box>
          <TextField label="Start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mr: 1 }} />
          <TextField label="End" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mr: 1 }} />
          <Button variant="contained" onClick={load} sx={{ mr: 1 }}>Filter</Button>
          <Button variant="outlined" onClick={generateCSV} disabled={reports.length === 0}>Generate CSV</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="order-type-label">Order Type</InputLabel>
          <Select labelId="order-type-label" value={selectedOrderType} label="Order Type" onChange={(e) => setSelectedOrderType(e.target.value)}>
            <MuiMenuItem value="">All</MuiMenuItem>
            <MuiMenuItem value="EAT_IN">Eat in</MuiMenuItem>
            <MuiMenuItem value="TO_GO">To go</MuiMenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="metric-label">Metric</InputLabel>
          <Select labelId="metric-label" value={metric} label="Metric" onChange={(e) => setMetric(e.target.value as 'total' | 'quantity')}>
            <MuiMenuItem value={'total'}>Total Price</MuiMenuItem>
            <MuiMenuItem value={'quantity'}>Quantity</MuiMenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select labelId="category-label" value={selectedCategory} label="Category" onChange={(e) => { setSelectedCategory(e.target.value); setSelectedItem(''); }}>
            <MuiMenuItem value="">All</MuiMenuItem>
            {categories.map((c) => (
              <MuiMenuItem key={c.id} value={c.id}>{c.name}</MuiMenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="item-label">Item</InputLabel>
          <Select labelId="item-label" value={selectedItem} label="Item" onChange={(e) => setSelectedItem(e.target.value)}>
            <MuiMenuItem value="">All</MuiMenuItem>
            {allItems.filter(it => !selectedCategory || it.categoryId === selectedCategory).map((it) => (
              <MuiMenuItem key={it.id} value={it.id}>{it.name}</MuiMenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Totals by day ({metric})</Typography>
        <Chart />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Items sold (filtered)</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aggregatedItems.map((it, idx) => (
              <TableRow key={idx}>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.unitPrice ? `$${it.unitPrice.toFixed(2)}` : ''}</TableCell>
                <TableCell>{it.quantity}</TableCell>
                <TableCell>${(it.total ?? 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Cash</TableCell>
              <TableCell>QR</TableCell>
              <TableCell>Eat in</TableCell>
              <TableCell>To go</TableCell>
              <TableCell>Items</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((r, idx) => (
              <TableRow key={`${r.date}-${idx}`}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.orderCount}</TableCell>
                <TableCell>${(r.total ?? 0).toFixed(2)}</TableCell>
                <TableCell>${(r.totalsByPayment?.CASH ?? 0).toFixed(2)}</TableCell>
                <TableCell>${(r.totalsByPayment?.QR_CODE ?? 0).toFixed(2)}</TableCell>
                <TableCell>${(r.totalsByOrderType?.EAT_IN ?? 0).toFixed(2)}</TableCell>
                <TableCell>${(r.totalsByOrderType?.TO_GO ?? 0).toFixed(2)}</TableCell>
                <TableCell>{(r.items || []).length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

    </Container>
  );
};

export default ReportsPage;
