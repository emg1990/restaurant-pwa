import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const SubItemPage: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Category {categoryId}
        </Typography>
        <Typography variant="body1">
          Items will appear here.
        </Typography>
      </Box>
    </Container>
  );
};

export default SubItemPage;
