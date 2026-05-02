//Integration tests
// Discount Calculation Integration 
describe("Discount Integration", () => {
  function applyDiscount(subtotal: number, discountPercent: number): {
    subtotal: number;
    discountAmount: number;
    total: number;
  } {
    const discountAmount = parseFloat(((subtotal * discountPercent) / 100).toFixed(2));
    const total = parseFloat((subtotal - discountAmount).toFixed(2));
    return { subtotal, discountAmount, total };
  }

  test("applies 10% discount correctly", () => {
    const result = applyDiscount(100, 10);
    expect(result.discountAmount).toBe(10);
    expect(result.total).toBe(90);
  });

  test("applies 20% discount correctly", () => {
    const result = applyDiscount(50, 20);
    expect(result.discountAmount).toBe(10);
    expect(result.total).toBe(40);
  });

  test("zero discount returns full price", () => {
    const result = applyDiscount(75, 0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(75);
  });

  test("discount does not make total negative", () => {
    const result = applyDiscount(10, 100);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test("handles decimal subtotals correctly", () => {
    const result = applyDiscount(99.99, 10);
    expect(result.total).toBe(89.99);
  });
});

// Order Flow Integration 
describe("Order Flow Integration", () => {
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending:    ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped:    ["delivered"],
    delivered:  [],
    cancelled:  [],
    refunded:   [],
  };

  function canTransition(from: string, to: string): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  function getNextStatus(current: string): string | null {
    const transitions = ALLOWED_TRANSITIONS[current];
    return transitions && transitions.length > 0 ? transitions[0] : null;
  }

  test("full order flow: pending → processing → shipped → delivered", () => {
    const flow = ["pending", "processing", "shipped", "delivered"];
    for (let i = 0; i < flow.length - 1; i++) {
      expect(canTransition(flow[i], flow[i + 1])).toBe(true);
    }
  });

  test("cannot skip from pending to shipped", () => {
    expect(canTransition("pending", "shipped")).toBe(false);
  });

  test("cannot revert delivered order", () => {
    expect(canTransition("delivered", "shipped")).toBe(false);
    expect(canTransition("delivered", "processing")).toBe(false);
  });

  test("can cancel from pending", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
  });

  test("can cancel from processing", () => {
    expect(canTransition("processing", "cancelled")).toBe(true);
  });

  test("cannot cancel delivered order", () => {
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  test("next status after pending is processing", () => {
    expect(getNextStatus("pending")).toBe("processing");
  });

  test("next status after shipped is delivered", () => {
    expect(getNextStatus("shipped")).toBe("delivered");
  });

  test("no next status after delivered", () => {
    expect(getNextStatus("delivered")).toBeNull();
  });
});

//  Cart + Shipping + Discount Full Checkout Integration
describe("Checkout Total Integration", () => {
  const SHIPPING_COST = 4.99;

  function calculateCheckoutTotal(
    items: { price: number; quantity: number }[],
    discountPercent: number = 0
  ): {
    itemTotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
  } {
    const itemTotal = parseFloat(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
    const discountAmount = parseFloat(((itemTotal * discountPercent) / 100).toFixed(2));
    const total = parseFloat((itemTotal - discountAmount + SHIPPING_COST).toFixed(2));
    return { itemTotal, discountAmount, shippingCost: SHIPPING_COST, total };
  }

  test("calculates checkout total with no discount", () => {
    const result = calculateCheckoutTotal([{ price: 50, quantity: 1 }]);
    expect(result.itemTotal).toBe(50);
    expect(result.discountAmount).toBe(0);
    expect(result.shippingCost).toBe(4.99);
    expect(result.total).toBe(54.99);
  });

  test("calculates checkout total with 10% discount", () => {
    const result = calculateCheckoutTotal([{ price: 100, quantity: 1 }], 10);
    expect(result.itemTotal).toBe(100);
    expect(result.discountAmount).toBe(10);
    expect(result.total).toBe(94.99);
  });

  test("calculates checkout total with multiple items and discount", () => {
    const result = calculateCheckoutTotal(
      [{ price: 50, quantity: 2 }, { price: 20, quantity: 1 }],
      20
    );
    expect(result.itemTotal).toBe(120);
    expect(result.discountAmount).toBe(24);
    expect(result.total).toBe(100.99);
  });

  test("shipping is always added", () => {
    const result = calculateCheckoutTotal([{ price: 10, quantity: 1 }]);
    expect(result.total).toBeGreaterThan(result.itemTotal);
    expect(result.shippingCost).toBe(4.99);
  });
});

// ── Reputation Score Integration
describe("Reputation Score Integration", () => {
  function calculateSellerScore(avgRating: number | null): number {
    if (avgRating === null) return 100;
    return Math.round(avgRating * 20);
  }

  function calculateBuyerScore(delivered: number, closed: number): number {
    if (closed === 0) return 100;
    return Math.max(0, Math.round(100 - ((closed - delivered) / closed) * 30));
  }

  function getTrustTier(score: number): string {
    if (score >= 90) return "Trusted";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  }

  test("perfect rating gives score of 100", () => {
    expect(calculateSellerScore(5)).toBe(100);
  });

  test("no reviews gives default score of 100", () => {
    expect(calculateSellerScore(null)).toBe(100);
  });

  test("average rating of 4 gives score of 80", () => {
    expect(calculateSellerScore(4)).toBe(80);
  });

  test("buyer with all delivered orders scores 100", () => {
    expect(calculateBuyerScore(10, 10)).toBe(100);
  });

  test("buyer with no orders scores 100", () => {
    expect(calculateBuyerScore(0, 0)).toBe(100);
  });

  test("buyer score never goes below 0", () => {
    expect(calculateBuyerScore(0, 10)).toBeGreaterThanOrEqual(0);
  });

  test("score of 95 is Trusted tier", () => {
    expect(getTrustTier(95)).toBe("Trusted");
  });

  test("score of 75 is Good tier", () => {
    expect(getTrustTier(75)).toBe("Good");
  });

  test("score of 55 is Fair tier", () => {
    expect(getTrustTier(55)).toBe("Fair");
  });

  test("score of 40 is Poor tier", () => {
    expect(getTrustTier(40)).toBe("Poor");
  });
});