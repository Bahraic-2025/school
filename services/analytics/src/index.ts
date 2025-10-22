import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { AttendanceAggregator } from './aggregations/attendanceAggregator';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/analytics/dashboard', verifyAuth, async (req, res) => {
  try {
    const rangeSchema = z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    });

    const { start, end } = rangeSchema.parse(req.query);

    const response = {
      kpis: {
        total_students: 0,
        active_students: 0,
        total_teachers: 0,
        fees_collected: 0,
        fees_pending: 0,
      },
      attendance: {
        today_rate: 0,
        trend: [],
      },
      enrollment: {
        monthly: [],
      },
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analytics/class/:classId/attendance', verifyAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const querySchema = z.object({
      start: z.string(),
      end: z.string(),
    });

    const { start, end } = querySchema.parse(req.query);

    const response = {
      class_id: classId,
      period: { start, end },
      attendance: [],
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analytics/fees/aging', verifyAuth, async (req, res) => {
  try {
    const asOfDate = (req.query.asOf as string) || new Date().toISOString().split('T')[0];

    const response = {
      as_of_date: asOfDate,
      aging_buckets: [
        { label: 'Current', amount: 0, count: 0 },
        { label: '1-30 days', amount: 0, count: 0 },
        { label: '31-60 days', amount: 0, count: 0 },
        { label: '61-90 days', amount: 0, count: 0 },
        { label: '90+ days', amount: 0, count: 0 },
      ],
    };

    res.json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/analytics/recompute', verifyAuth, async (req, res) => {
  try {
    const bodySchema = z.object({
      target: z.enum(['attendance_daily', 'fees_monthly', 'enrollment_trends']),
      range: z.object({
        start: z.string(),
        end: z.string(),
      }),
    });

    const { target, range } = bodySchema.parse(req.body);

    res.json({
      success: true,
      message: `Recomputation of ${target} scheduled`,
      range,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Analytics API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
