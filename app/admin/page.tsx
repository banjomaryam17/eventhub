async function getStats() {
    const res = await fetch("http://localhost:3000/api/admin/dashboard", {
      cache: "no-store",
    });
  
    if (!res.ok) throw new Error("Failed to fetch stats");
  
    return res.json();
  }
  
  export default async function AdminPage() {
    const data = await getStats();
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-sm text-slate-400">Users</h2>
          <p className="text-2xl font-bold">{data.totalUsers}</p>
        </div>
  
        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-sm text-slate-400">Listings</h2>
          <p className="text-2xl font-bold">{data.totalListings}</p>
        </div>
  
        <div className="bg-slate-900 p-6 rounded-xl">
          <h2 className="text-sm text-slate-400">Orders</h2>
          <p className="text-2xl font-bold">{data.totalOrders}</p>
        </div>
      </div>
    );
  }