import React from "react";
import { useLocation } from "react-router-dom";

const HalamanOtomatis: React.FC = () => {
  // Mengambil informasi URL saat ini
  const location = useLocation();

  // Mengambil kata terakhir dari URL (misal: /admin/kelola-guru -> "kelola-guru")
  const pathTerakhir = location.pathname.split("/").pop() || "Halaman";

  // Mengganti tanda strip (-) jadi spasi dan membuat huruf jadi kapital
  const judulOtomatis = pathTerakhir.replace(/-/g, " ").toUpperCase();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Menu: {judulOtomatis}</h1>
      <p>
        ⚠️ Halaman ini masih berupa kerangka (scaffolding) dan sedang dalam
        tahap pengembangan.
      </p>
    </div>
  );
};

// Rahasianya ada di sini: Karena pakai "export default", nama fungsinya tidak harus sama dengan nama file!
export default HalamanOtomatis;
