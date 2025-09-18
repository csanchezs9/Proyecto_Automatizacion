const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();

// Rutas para productos
router.get('/', ProductController.getAllProducts);
router.post('/', ProductController.createProduct);
router.get('/stats', ProductController.getProductStats);
router.get('/pdf', ProductController.generateProductsPDF);
router.get('/pdf/detailed', ProductController.generateDetailedPDF);
router.get('/download/:filename', ProductController.downloadPDF);
router.get('/:id', ProductController.getProductById);
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;
