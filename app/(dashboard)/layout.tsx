import { verifySession } from "@/lib/dal";
import Sidebar from "@/app/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  const user = {
    name:     session.name,
    email:    session.email,
    initials: session.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    role:     session.role,
  };

  return (
    <div className="flex h-full bg-sand-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
        {/* Reserve height for mobile bottom navigation bar */}
        <div className="h-16 flex-shrink-0 lg:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
