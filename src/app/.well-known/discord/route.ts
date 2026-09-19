export function GET() {
  return new Response("dh=3bd099b2e442d95db1a3a2a93b5e44bbbd531377", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
