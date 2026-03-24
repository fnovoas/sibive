import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>SIBIVE</h1>

      <ul>
        <li><Link href="/register">Registrar Vehículo</Link></li>
        <li><Link href="/inspection">Registrar Inspección</Link></li>
        <li><Link href="/history">Ver Historial</Link></li>
      </ul>
    </div>
  );
}