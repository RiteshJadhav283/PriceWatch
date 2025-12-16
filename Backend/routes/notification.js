const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notification_controller');

// All routes require authentication
router.use(protect);

// Get all notifications for user
router.get('/', getNotifications);

// Mark all as read (must be before /:id routes)
router.patch('/read-all', markAllAsRead);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
