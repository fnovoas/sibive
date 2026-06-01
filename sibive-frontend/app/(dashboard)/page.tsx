import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { NAV_ITEMS } from "@/lib/constants";

const shortcuts = NAV_ITEMS.filter((item) => item.href !== "/");

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Panel principal"
        description="Gestión de inspecciones vehiculares sobre blockchain privada. Elija una acción del menú lateral o use los accesos rápidos."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <Card className="transition-shadow group-hover:shadow-md">
              <h2 className="font-medium text-brand">{item.label}</h2>
              <p className="mt-2 text-sm text-muted">
                Ir a {item.label.toLowerCase()}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
