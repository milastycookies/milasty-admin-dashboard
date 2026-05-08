import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = Math.max(16, Math.min(512, parseInt(sizeStr, 10) || 192));

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#1E0D04",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(size * 0.22),
        }}
      >
        <span
          style={{
            color: "#FAF7F2",
            fontSize: Math.round(size * 0.52),
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    ),
    { width: size, height: size }
  );

  // Icons are deterministic — cache aggressively at CDN and browser
  return new Response(imageResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
