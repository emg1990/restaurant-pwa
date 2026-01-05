import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardActions, IconButton, CardMedia, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LocalPizzaIcon from '@mui/icons-material/LocalPizza';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import IcecreamIcon from '@mui/icons-material/Icecream';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';

import type { Category, MenuItem } from '../models/types';
import { getAllCategories, getAllItems } from '../services/db';
import { useCart } from '../context/CartContext';

const AVAILABLE_ICONS = [
  { name: 'Fastfood', icon: <FastfoodIcon sx={{ fontSize: 60 }} /> },
  { name: 'Pizza', icon: <LocalPizzaIcon sx={{ fontSize: 60 }} /> },
  { name: 'Burger', icon: <LunchDiningIcon sx={{ fontSize: 60 }} /> },
  { name: 'Cafe', icon: <LocalCafeIcon sx={{ fontSize: 60 }} /> },
  { name: 'Icecream', icon: <IcecreamIcon sx={{ fontSize: 60 }} /> },
  { name: 'Restaurant', icon: <RestaurantIcon sx={{ fontSize: 60 }} /> },
  { name: 'Bar', icon: <LocalBarIcon sx={{ fontSize: 60 }} /> },
  { name: 'Bakery', icon: <BakeryDiningIcon sx={{ fontSize: 60 }} /> },
  { name: 'Dinner', icon: <DinnerDiningIcon sx={{ fontSize: 60 }} /> },
];

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { addToCart, items: cartItems, updateQuantity } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const cats = await getAllCategories();
      const allItems = await getAllItems();
      setCategories(cats);
      setItems(allItems);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    };
    fetchData();
  }, []);

  const filteredItems = items.filter((item) => item.categoryId === selectedCategory);

  const getQuantity = (itemId: string) => {
    const cartItem = cartItems.find((i) => i.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item, 1);
  };

  const renderItemImage = (item: MenuItem) => {
    if (item.thumbnail) {
      return (
        <CardMedia
          component="img"
          height="140"
          image={item.thumbnail}
          alt={item.name}
        />
      );
    }

    let iconElement = <RestaurantIcon sx={{ fontSize: 60 }} />;
    if (item.icon) {
      const iconObj = AVAILABLE_ICONS.find(i => i.name === item.icon);
      if (iconObj) {
        iconElement = iconObj.icon;
      }
    }

    return (
      <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
        {iconElement}
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', mb: 4, py: 1 }}>
          {categories.map((cat) => {
            let iconElement = <RestaurantIcon sx={{ fontSize: 40 }} />;
            if (cat.icon) {
              const match = AVAILABLE_ICONS.find(i => i.name === cat.icon);
              if (match) iconElement = match.icon;
            }
            return (
              <Box
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{ minWidth: 120, textAlign: 'center', cursor: 'pointer' }}
              >
                {cat.thumbnail ? (
                  <Avatar src={cat.thumbnail} alt={cat.name} sx={{ width: 72, height: 72, mx: 'auto' }} />
                ) : (
                  <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: 'action.hover' }}>{iconElement}</Avatar>
                )}
                <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 600 }}>{cat.name}</Typography>
              </Box>
            );
          })}
        </Box>

        <Grid container spacing={3}>
          {filteredItems.map((item) => {
            const quantity = getQuantity(item.id);
            return (
              <Grid size={{ xs: 6, sm: 6, md: 4 }} key={item.id}>
                <Card>
                  <div onClick={() => handleAddToCart(item)} style={{ cursor: 'pointer' }}>
                    {renderItemImage(item)}
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                        ${item.price.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </div>
                  <CardActions>
                    {quantity > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
                        <IconButton size="large" onClick={() => updateQuantity(item.id, quantity - 1)} color="primary">
                          <RemoveIcon fontSize="large" />
                        </IconButton>
                        <Typography sx={{ minWidth: '35px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>{quantity}</Typography>
                        <IconButton size="large" onClick={() => updateQuantity(item.id, quantity + 1)} color="primary">
                          <AddIcon fontSize="large" />
                        </IconButton>
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;
