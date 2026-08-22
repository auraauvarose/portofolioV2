// Discord profile domain verification — HTTPS method.
// Discord fetches https://<domain>/.well-known/discord and expects the body to
// be exactly the verification value, served inline as plain text.
export function GET() {
  return new Response("dh=cb6feae0167e25964f1a3cfd52e657efe988a3da", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
