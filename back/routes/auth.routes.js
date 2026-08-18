const express = require('express')
const router = express.Router();
const { register, login, googleAuth, getMe, logout, changePassword } = require('../controllers/auth.controller')
const protect = require('../middleware/auth.middleware')

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.put('/change-password', protect, changePassword);

// router.get('/:id', (req, res) => {
//     res.json({
//         message: `User: ${req.params.id}`
//     })
// })

module.exports = router