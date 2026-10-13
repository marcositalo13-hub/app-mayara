import type { Metadata } from "next";
import { StylePreview } from "./style-preview";

export const metadata: Metadata = {
  title: "Estilo · Plano Mayara",
};

export default function EstiloPage() {
  return <StylePreview />;
}
