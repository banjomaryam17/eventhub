async function getListings() {
    const res = await fetch("http://localhost:3000/api/admin/listing", {
      cache: "no-store",
    });
  
    if (!res.ok) throw new Error("Failed to fetch listings");
  
    return res.json();
  }
  
  export default async function ListingsPage() {
    const data = await getListings();
  
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Listings</h2>
  
        <div className="space-y-4">
          {data.listings.map((listing: any) => (
            <div
              key={listing.id}
              className="bg-slate-900 p-4 rounded-lg flex justify-between"
            >
              <div>
                <p className="font-medium">{listing.title}</p>
                <p className="text-sm text-slate-400">
                  €{listing.price} • {listing.seller}
                </p>
              </div>
  
              <span
                className={`text-sm ${
                  listing.is_active ? "text-green-400" : "text-red-400"
                }`}
              >
                {listing.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }