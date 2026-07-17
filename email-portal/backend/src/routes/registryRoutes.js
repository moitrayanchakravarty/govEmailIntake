const express = require('express');
const router = express.Router();
const { searchRegistry } = require('../controllers/registryController');


const { protect } = require('../middleware/authMiddleware');

// Route configuration (REG-02, REG-04)
// For now, testing directly without middleware. I will add "protect" later.[cite: 4]
router.get('/search', protect, searchRegistry);

module.exports = router;

