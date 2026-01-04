import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  Button,
  Divider,
  IconButton,
  TextField,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useCart } from '../context/CartContext';
import { addOrder, getNextOrderNumber } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import type { Order, PaymentMethod } from '../models/types';
import { useNavigate } from 'react-router-dom';

const SummaryPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, updatePrice, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    const orderNumber = await getNextOrderNumber();

    const order: Order = {
      id: uuidv4(),
      shortId: uuidv4().slice(0, 8),
      orderNumber: orderNumber,
      createdAt: Date.now(),
      items: items,
      totalAmount: total,
      status: 'PENDING',
      paymentMethod: paymentMethod === 'QR_CODE' ? 'QR_CODE' : 'CASH',
    };

    await addOrder(order);

    // after creating order, clear cart and go to printable order page
    clearCart();
    navigate(`/order/print/${order.id}`);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Order Summary
          </Typography>
          {items.length > 0 && (
            <IconButton onClick={() => setIsEditMode(!isEditMode)} color="primary">
              {isEditMode ? <CheckIcon /> : <EditIcon />}
            </IconButton>
          )}
        </Box>

        {items.length === 0 ? (
          <Typography variant="body1">Your cart is empty.</Typography>
        ) : (
          <>
            <List>
              {items.map((item) => (
                <ListItem
                  key={item.itemId}
                  sx={{ display: 'block', mb: 2, borderBottom: '1px solid #eee', pb: 2 }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {item.name}
                      </Typography>
                      {/* Variants removed: variantName no longer used */}
                    </Grid>
                    <Grid size={{ xs: 3, sm: 2 }}>
                      {isEditMode ? (
                        <TextField
                          label="Qty"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.itemId, parseInt(e.target.value) || 0)}
                          size="small"
                          fullWidth
                          inputProps={{ min: 0 }}
                        />
                      ) : (
                        <Typography variant="body1">Qty: {item.quantity}</Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3 }}>
                      {isEditMode ? (
                        <TextField
                          label="Price"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updatePrice(item.itemId, parseFloat(e.target.value) || 0)}
                          size="small"
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      ) : (
                        <Typography variant="body1">${item.unitPrice.toFixed(2)}</Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 3, sm: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton edge="end" aria-label="delete" onClick={() => removeFromCart(item.itemId)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Payment method
                </Typography>
                <RadioGroup
                  row
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <FormControlLabel value="CASH" control={<Radio />} label="Cash" />
                  <FormControlLabel value="QR_CODE" control={<Radio />} label="QR" />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">${total.toFixed(2)}</Typography>
            </Box>

            <Button variant="contained" color="primary" fullWidth size="large" onClick={handlePlaceOrder}>
              Place Order
            </Button>

            {/* navigation to printable order page handled after placing order */}
          </>
        )}
      </Box>
    </Container>
  );
};

export default SummaryPage;
