import express from 'express';
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from '../controllers/stats.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// Route /dashboard/stats
app.get('/stats', adminOnly, getDashboardStats)

// Route /dashboard/pie
app.get('/pie', adminOnly, getPieCharts)

// Route /dashboard/bar
app.get('/bar', adminOnly, getBarCharts)

// Route /dashboard/line
app.get('/line', adminOnly, getLineCharts)



export default app