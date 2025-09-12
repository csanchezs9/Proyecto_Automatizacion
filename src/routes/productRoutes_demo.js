const express = require('express');
const ProductController = require('../controllers/productController_demo');

const router = express.Router();

// Rutas para productos (versión demo)
router.get('/', ProductController.getAllProducts);
router.get('/stats', ProductController.getProductStats);
router.get('/pdf', ProductController.generateProductPDF);
router.get('/pdf/detailed', ProductController.generateDetailedProductPDF);
router.get('/:id', ProductController.getProductById);

module.exports = router;