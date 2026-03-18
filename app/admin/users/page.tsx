async function getUsers() {
    const res = await fetch("http://localhost:3000/api/admin/users", {
      cache: "no-store",
    });
  
    if (!res.ok) throw new Error("Failed to fetch users");
  
    return res.json();
  }
  
  export default async function UsersPage() {
    const data = await getUsers();
  
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Manage Users</h2>
  
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-left p-3">Listings</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
  
            <tbody>
              {data.users.map((user: any) => (
                <tr key={user.id} className="border-t border-slate-800">
                  
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}</td>
  
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
  
                  <td className="p-3">{user.listing_count}</td>
  
                  <td className="p-3 flex gap-2">
                    
                    {/* Change Role */}
                    <form action="/api/admin/change_role" method="POST">
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={user.role === "admin" ? "user" : "admin"}
                      />
                      <button className="bg-blue-600 px-3 py-1 rounded text-xs">
                        Make {user.role === "admin" ? "User" : "Admin"}
                      </button>
                    </form>
  
                    {/* Ban */}
                    <form action="/api/admin/ban_user" method="POST">
                      <input type="hidden" name="userId" value={user.id} />
                      <button className="bg-red-600 px-3 py-1 rounded text-xs">
                        Ban
                      </button>
                    </form>
  
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }