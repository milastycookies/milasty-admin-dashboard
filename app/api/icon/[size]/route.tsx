import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = Math.max(16, Math.min(512, parseInt(sizeStr, 10) || 192));

  return new ImageResponse(
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
}
