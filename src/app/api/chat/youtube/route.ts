import { NextRequest } from 'next/server';
import { LiveChat } from 'youtube-chat';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const type = searchParams.get('type') || 'handle';

  if (!id) {
    return new Response('Missing youtube id', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let liveChat: LiveChat;

      if (type === 'channelId') {
        liveChat = new LiveChat({ channelId: id });
      } else if (type === 'liveId') {
        liveChat = new LiveChat({ liveId: id });
      } else {
        liveChat = new LiveChat({ handle: id });
      }

      liveChat.on('chat', (chatItem) => {
        const payload = JSON.stringify(chatItem);
        controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
      });

      liveChat.on('error', (err: any) => {
        controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${err.message || 'Unknown error'}\n\n`));
      });

      liveChat.on('end', (reason) => {
        controller.enqueue(new TextEncoder().encode(`event: end\ndata: ${reason || 'Ended'}\n\n`));
        controller.close();
      });

      request.signal.addEventListener('abort', () => {
        liveChat.stop();
      });

      liveChat.start().catch((err: any) => {
        controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${err.message || 'Failed to start'}\n\n`));
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
