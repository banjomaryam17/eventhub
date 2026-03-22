describe("Registration Validation", () => {
  //Password strength
  describe("Password validation", () => {
    function isStrongPassword(password: string): boolean {
      return password.length >= 8;
    }

    test("accepts password with 8 or more characters", () => {
      expect(isStrongPassword("password123")).toBe(true);
    });

    test("rejects password with less than 8 characters", () => {
      expect(isStrongPassword("abc")).toBe(false);
    });

    test("rejects empty password", () => {
      expect(isStrongPassword("")).toBe(false);
    });

    test("accepts password with exactly 8 characters", () => {
      expect(isStrongPassword("abcdefgh")).toBe(true);
    });
  });

  //  Email validation 
  describe("Email validation", () => {
    function isValidEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    test("accepts valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    test("rejects email without @", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    test("rejects email without domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    test("rejects empty email", () => {
      expect(isValidEmail("")).toBe(false);
    });

    test("rejects email with spaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
    });
  });

  // Username validation
  describe("Username validation", () => {
    function isValidUsername(username: string): boolean {
      return username.trim().length >= 3 && username.trim().length <= 30;
    }

    test("accepts valid username", () => {
      expect(isValidUsername("maryam")).toBe(true);
    });

    test("rejects username shorter than 3 characters", () => {
      expect(isValidUsername("ab")).toBe(false);
    });

    test("rejects username longer than 30 characters", () => {
      expect(isValidUsername("a".repeat(31))).toBe(false);
    });

    test("rejects empty username", () => {
      expect(isValidUsername("")).toBe(false);
    });

    test("accepts username with exactly 3 characters", () => {
      expect(isValidUsername("abc")).toBe(true);
    });
  });
});

//  Listing Validation 
describe("Listing Validation", () => {
  function validateListing(data: {
    title: string;
    price: number;
    quantity: number;
    condition: string;
    category_id: number;
  }): { valid: boolean; error?: string } {
    if (!data.title || data.title.trim().length < 3) {
      return { valid: false, error: "Title must be at least 3 characters" };
    }
    if (data.title.trim().length > 100) {
      return { valid: false, error: "Title must be 100 characters or less" };
    }
    if (isNaN(data.price) || data.price < 0) {
      return { valid: false, error: "Price must be a positive number" };
    }
    if (isNaN(data.quantity) || data.quantity < 1) {
      return { valid: false, error: "Quantity must be at least 1" };
    }
    const validConditions = ["new", "used", "refurbished"];
    if (!validConditions.includes(data.condition)) {
      return { valid: false, error: "Invalid condition" };
    }
    if (!data.category_id || isNaN(data.category_id)) {
      return { valid: false, error: "Category is required" };
    }
    return { valid: true };
  }

  test("accepts valid listing", () => {
    const result = validateListing({
      title: "iPhone 13",
      price: 450,
      quantity: 1,
      condition: "used",
      category_id: 1,
    });
    expect(result.valid).toBe(true);
  });

  test("rejects listing with short title", () => {
    const result = validateListing({
      title: "ab",
      price: 450,
      quantity: 1,
      condition: "used",
      category_id: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Title must be at least 3 characters");
  });

  test("rejects listing with negative price", () => {
    const result = validateListing({
      title: "iPhone 13",
      price: -10,
      quantity: 1,
      condition: "used",
      category_id: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Price must be a positive number");
  });

  test("rejects listing with zero quantity", () => {
    const result = validateListing({
      title: "iPhone 13",
      price: 450,
      quantity: 0,
      condition: "used",
      category_id: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be at least 1");
  });

  test("rejects listing with invalid condition", () => {
    const result = validateListing({
      title: "iPhone 13",
      price: 450,
      quantity: 1,
      condition: "broken",
      category_id: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid condition");
  });

  test("accepts all valid conditions", () => {
    ["new", "used", "refurbished"].forEach((condition) => {
      const result = validateListing({
        title: "Test item",
        price: 10,
        quantity: 1,
        condition,
        category_id: 1,
      });
      expect(result.valid).toBe(true);
    });
  });
});

//  Cart Validation
describe("Cart Validation", () => {
  function validateCartItem(quantity: number, stock: number): { valid: boolean; error?: string } {
    if (isNaN(quantity) || quantity < 1) {
      return { valid: false, error: "Quantity must be at least 1" };
    }
    if (quantity > stock) {
      return { valid: false, error: `Only ${stock} item(s) available in stock` };
    }
    return { valid: true };
  }

  test("accepts valid quantity within stock", () => {
    expect(validateCartItem(1, 5).valid).toBe(true);
  });

  test("accepts quantity equal to stock", () => {
    expect(validateCartItem(5, 5).valid).toBe(true);
  });

  test("rejects quantity exceeding stock", () => {
    const result = validateCartItem(6, 5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Only 5 item(s) available in stock");
  });

  test("rejects zero quantity", () => {
    const result = validateCartItem(0, 5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Quantity must be at least 1");
  });

  test("rejects negative quantity", () => {
    const result = validateCartItem(-1, 5);
    expect(result.valid).toBe(false);
  });
});

// Price Calculation
describe("Price Calculation", () => {
  function calculateCartTotal(items: { price: number; quantity: number }[]): number {
    return parseFloat(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
  }

  test("calculates total for single item", () => {
    expect(calculateCartTotal([{ price: 10, quantity: 2 }])).toBe(20);
  });

  test("calculates total for multiple items", () => {
    expect(
      calculateCartTotal([
        { price: 10, quantity: 2 },
        { price: 5, quantity: 3 },
      ])
    ).toBe(35);
  });

  test("returns 0 for empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  test("handles decimal prices correctly", () => {
    expect(calculateCartTotal([{ price: 9.99, quantity: 3 }])).toBe(29.97);
  });
});

// Order Status Validation
describe("Order Status Validation", () => {
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

  function isValidStatus(status: string): boolean {
    return validStatuses.includes(status);
  }

  test("accepts all valid statuses", () => {
    validStatuses.forEach((status) => {
      expect(isValidStatus(status)).toBe(true);
    });
  });

  test("rejects invalid status", () => {
    expect(isValidStatus("paid")).toBe(false);
    expect(isValidStatus("unknown")).toBe(false);
    expect(isValidStatus("")).toBe(false);
  });

  test("is case sensitive", () => {
    expect(isValidStatus("Processing")).toBe(false);
    expect(isValidStatus("SHIPPED")).toBe(false);
  });
});