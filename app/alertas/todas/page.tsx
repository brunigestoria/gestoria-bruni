import { Suspense } from "react";
import AlertasContent from "./AlertasContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AlertasContent />
    </Suspense>
  );
}