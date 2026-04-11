import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
