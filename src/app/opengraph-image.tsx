import { ImageResponse } from "next/og";
import { getActiveVocabulary } from "@/lib/active-theme";
import { getDataProvider } from "@/lib/data";

export const alt = "Suvrt Sharma — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse (Satori) supports only inline styles + flexbox — no Tailwind.
export default function OpenGraphImage() {
  const profile = getDataProvider().getProfile();
  const vocab = getActiveVocabulary();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#04111a",
          color: "#e9ddc1",
          padding: "64px",
          border: "10px solid #d4af37",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#d4af37",
          }}
        >
          {vocab.worldName}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
            {profile.name}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#d4af37", marginTop: 8 }}>
            {profile.role}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#93a7b4",
              marginTop: 24,
              maxWidth: 900,
            }}
          >
            {profile.tagline}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#93a7b4" }}>
          {vocab.exploreCta} →
        </div>
      </div>
    ),
    size,
  );
}
