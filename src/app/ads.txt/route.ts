import { NextResponse } from 'next/server';

export function GET() {
  const content = 'google.com, pub-3522634980237009, DIRECT, f08c47fec0942fa0\n';
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
