import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, MenuItem as MuiMenuItem, Select, FormControl, InputLabel, Tabs, Tab, List, ListItem, ListItemText, IconButton, Divider, Accordion, AccordionSummary, AccordionDetails, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { getAllCategories, getAllItems, addItem, addCategory, deleteCategory, deleteItem, updateCategory, updateItem } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

const AVAILABLE_ICONS = [
  { name: 'Fastfood', icon: <FastfoodIcon /> },
  { name: 'Pizza', icon: <LocalPizzaIcon /> },
  { name: 'Burger', icon: <LunchDiningIcon /> },
  { name: 'Cafe', icon: <LocalCafeIcon /> },
  { name: 'Icecream', icon: <IcecreamIcon /> },
  { name: 'Restaurant', icon: <RestaurantIcon /> },
  { name: 'Bar', icon: <LocalBarIcon /> },
  { name: 'Bakery', icon: <BakeryDiningIcon /> },
  { name: 'Dinner', icon: <DinnerDiningIcon /> },
];

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  
  // Item State
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    description: '',
    categoryId: '',
    thumbnail: '',
    icon: '',
    isEnabled: true
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Category State
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    displayOrder: 0,
    thumbnail: '',
    isEnabled: true
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Variant State
  const [newVariant, setNewVariant] = useState({ name: '', priceModifier: 0 });

  const handleAddVariant = () => {
    if (!newVariant.name) return;
    const variant = { id: uuidv4(), name: newVariant.name, priceModifier: Number(newVariant.priceModifier) };
    setItemForm(prev => ({ ...prev, variants: [...(prev.variants || []), variant] }));
    setNewVariant({ name: '', priceModifier: 0 });
  };

  const handleRemoveVariant = (id: string) => {
    setItemForm(prev => ({ ...prev, variants: prev.variants?.filter(v => v.id !== id) }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cats = await getAllCategories();
    const allItems = await getAllItems();
    setCategories(cats);
    setItems(allItems);
    
    // Set default category for new item if not set
    if (cats.length > 0 && !itemForm.categoryId && !editingItemId) {
      setItemForm(prev => ({ ...prev, categoryId: cats[0].id }));
    }
  };

  // --- Item Handlers ---

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) return;

    if (editingItemId) {
      const updatedItem: MenuItem = {
        ...itemForm as MenuItem,
        id: editingItemId,
      };
      await updateItem(updatedItem);
      alert('Item updated!');
    } else {
      const newItem: MenuItem = {
        id: uuidv4(),
        name: itemForm.name!,
        price: Number(itemForm.price),
        description: itemForm.description || '',
        categoryId: itemForm.categoryId!,
        thumbnail: itemForm.thumbnail || '',
        icon: itemForm.icon || '',
        isEnabled: true,
        variants: itemForm.variants || []
      };
      await addItem(newItem);
      alert('Item added!');
    }
    
    resetItemForm();
    loadData();
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm(item);
    window.scrollTo(0, 0);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
      loadData();
    }
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm({ 
      name: '', 
      price: 0, 
      description: '', 
      categoryId: categories.length > 0 ? categories[0].id : '', 
      thumbnail: '', 
      icon: '',
      isEnabled: true 
    });
  };

  // --- Category Handlers ---

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    if (editingCategoryId) {
      const updatedCategory: Category = {
        ...categoryForm as Category,
        id: editingCategoryId,
      };
      await updateCategory(updatedCategory);
      alert('Category updated!');
    } else {
      const newCategory: Category = {
        id: uuidv4(),
        name: categoryForm.name!,
        displayOrder: Number(categoryForm.displayOrder) || 0,
        thumbnail: categoryForm.thumbnail || '',
        isEnabled: true
      };
      await addCategory(newCategory);
      alert('Category added!');
    }

    resetCategoryForm();
    loadData();
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryForm(category);
    window.scrollTo(0, 0);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure? This will not delete items in this category.')) {
      await deleteCategory(id);
      loadData();
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', displayOrder: 0, thumbnail: '', isEnabled: true });
  };

  // --- File Handler ---

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev: any) => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderItemIcon = (item: MenuItem) => {
    if (item.thumbnail) {
      return (
        <Box sx={{ mr: 2, width: 50, height: 50 }}>
          <img src={item.thumbnail} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
        </Box>
      );
    }
    if (item.icon) {
      const iconObj = AVAILABLE_ICONS.find(i => i.name === item.icon);
      if (iconObj) {
        return <Box sx={{ mr: 2, width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>{iconObj.icon}</Box>;
      }
    }
    return <Box sx={{ mr: 2, width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}><RestaurantIcon /></Box>;
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 4 }}>
          <Tab label="Manage Items" />
          <Tab label="Manage Categories" />
        </Tabs>
        
        {activeTab === 0 && (
          <Box>
            <Box component="form" onSubmit={handleSaveItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <Typography variant="h6">{editingItemId ? 'Edit Item' : 'Add New Item'}</Typography>
              
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={itemForm.categoryId}
                  label="Category"
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MuiMenuItem key={cat.id} value={cat.id}>{cat.name}</MuiMenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
              
              <TextField
                label="Price"
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                required
              />

              <TextField
                label="Description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                multiline
                rows={2}
              />

              <Typography variant="subtitle1">Thumbnail or Icon</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                 <Button variant="contained" component="label">
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setItemForm)} />
                </Button>
                <Typography variant="body2">OR Select Icon:</Typography>
                <ToggleButtonGroup
                  value={itemForm.icon}
                  exclusive
                  onChange={(_, newIcon) => setItemForm({ ...itemForm, icon: newIcon })}
                  aria-label="select icon"
                  size="small"
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <ToggleButton key={icon.name} value={icon.name} aria-label={icon.name}>
                      {icon.icon}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {itemForm.thumbnail && (
                <Box sx={{ mt: 1, maxWidth: 200 }}>
                  <img src={itemForm.thumbnail} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                </Box>
              )}

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Variants (Optional)</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  label="Variant Name (e.g. Large)"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                  size="small"
                />
                <TextField
                  label="Price Modifier (+)"
                  type="number"
                  value={newVariant.priceModifier}
                  onChange={(e) => setNewVariant({ ...newVariant, priceModifier: Number(e.target.value) })}
                  size="small"
                  sx={{ width: 100 }}
                />
                <Button variant="outlined" onClick={handleAddVariant}>Add</Button>
              </Box>
              <List dense>
                {itemForm.variants?.map((v) => (
                  <ListItem key={v.id} secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveVariant(v.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <ListItemText primary={v.name} secondary={`+${v.priceModifier}`} />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  {editingItemId ? 'Update Item' : 'Add Item'}
                </Button>
                {editingItemId && (
                  <Button variant="outlined" color="secondary" onClick={resetItemForm} fullWidth>
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom>Existing Items (Grouped by Category)</Typography>
            {categories.map((cat) => {
              const catItems = items.filter(i => i.categoryId === cat.id);
              if (catItems.length === 0) return null;
              
              return (
                <Accordion key={cat.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="bold">{cat.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {catItems.map((item) => (
                        <ListItem
                          key={item.id}
                          secondaryAction={
                            <Box>
                              <IconButton aria-label="edit" onClick={() => handleEditItem(item)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton aria-label="delete" onClick={() => handleDeleteItem(item.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          {renderItemIcon(item)}
                          <ListItemText 
                            primary={item.name} 
                            secondary={`$${item.price.toFixed(2)}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Box component="form" onSubmit={handleSaveCategory} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <Typography variant="h6">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</Typography>
              <TextField
                label="Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
              <TextField
                label="Display Order"
                type="number"
                value={categoryForm.displayOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
              />
               <Button variant="contained" component="label">
                Upload Thumbnail
                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setCategoryForm)} />
              </Button>
              {categoryForm.thumbnail && (
                <Box sx={{ mt: 1, maxWidth: 200 }}>
                  <img src={categoryForm.thumbnail} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  {editingCategoryId ? 'Update Category' : 'Add Category'}
                </Button>
                {editingCategoryId && (
                  <Button variant="outlined" color="secondary" onClick={resetCategoryForm} fullWidth>
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom>Existing Categories</Typography>
            <List>
              {categories.map((cat) => (
                <ListItem
                  key={cat.id}
                  secondaryAction={
                    <Box>
                      <IconButton aria-label="edit" onClick={() => handleEditCategory(cat)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton aria-label="delete" onClick={() => handleDeleteCategory(cat.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  {cat.thumbnail && (
                    <Box sx={{ mr: 2, width: 50, height: 50 }}>
                      <img src={cat.thumbnail} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                    </Box>
                  )}
                  <ListItemText primary={cat.name} secondary={`Order: ${cat.displayOrder}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AdminPage;
