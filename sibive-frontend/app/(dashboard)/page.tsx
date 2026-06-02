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
        description="Gestión de inspecciones vehiculares sobre blockchain privada. Aquí podrá realizar las siguientes acciones."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <Card className="transition-shadow group-hover:shadow-md">
              <h2 className="font-medium text-brand">{item.label}</h2>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
