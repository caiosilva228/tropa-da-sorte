import { Database } from '@/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const state = await Database.getState();
    return NextResponse.json({
      status: 'healthy',
      app: 'Tropa da Sorte',
      timestamp: new Date().toISOString(),
      rafflesCount: state.raffles.length,
      numbersCount: state.raffleNumbers.length,
      ordersCount: state.orders.length,
      database: 'connected',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    return NextResponse.json({ status: 'unhealthy', error: errorMsg }, { status: 500 });
  }
}
