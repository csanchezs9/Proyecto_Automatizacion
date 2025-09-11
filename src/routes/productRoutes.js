const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();

// Rutas para productos
router.get('/', ProductController.getAllProducts);
router.get('/stats', ProductController.getProductStats);
router.get('/pdf', ProductController.generateProductsPDF);
router.get('/pdf/detailed', ProductController.generateDetailedPDF);
router.get('/:id', ProductController.getProductById);

module.exports = router;
