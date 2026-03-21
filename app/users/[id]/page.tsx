async function getUser(userId: string) {
    const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
      cache: "no-store",
    });
  
    if (!res.ok) throw new Error("Failed to fetch user");
  
    return res.json();
  }
  
  export default async function UserProfile({ params }: any) {
    const data = await getUser(params.id);
  
    const user = data.user;
  
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">{user.username}</h1>
  
        <div className="bg-slate-900 p-5 rounded-xl mb-6">
          <p className="text-sm text-slate-400">Reputation</p>
          <p className="text-xl font-bold">{user.reputation_score}%</p>
          <p className="text-sm text-slate-400">
            {user.total_sales} sales
          </p>
  
          {user.is_verified_seller && (
            <p className="text-green-400 text-sm mt-2">
              ✔ Verified Seller
            </p>
          )}
        </div>
  
        <div>
          <h2 className="text-lg font-semibold mb-4">Listings</h2>
  
          <div className="space-y-3">
            {user.listings.map((listing: any) => (
              <div key={listing.id} className="bg-slate-900 p-4 rounded-lg">
                <p>{listing.title}</p>
                <p className="text-sm text-slate-400">€{listing.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }