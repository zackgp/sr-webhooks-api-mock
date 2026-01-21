import { Hono } from "hono";

const app = new Hono();

// In-memory version of GIFT_CARD_BALANCES
// Ruby: GIFT_CARD_BALANCES = Hash.new { |hash, key| hash[key] = 0 }
const balances: Record<string, number> = {
  "CW001": 10000,
  "CW002": 10,
  "CW003": 0,
};

app.get("/", (c) => {
  return c.text("Springboard Retail Webhooks Mock API");
});

// resource :gift_cards
const giftCards = new Hono();

['check_balance', 'capture', 'refund', 'void'].forEach((base_path) => {
  giftCards.post(`/${base_path}_error`, async (c) => {
    return c.json({ message: "Error example with message key" }, 400);
  });

  giftCards.post(`/${base_path}_error_json`, async (c) => {
    return c.json({ error: "Error example without message key" }, 422);
  });

  giftCards.post(`/${base_path}_error_text`, async (c) => {
    return c.text("Error example is not JSON", 500);
  });
});

// POST /gift_cards/check_balance
giftCards.post("/check_balance", async (c) => {
  try {
    const body = await c.req.json();
    const number = String(body.number);

    // Validation: number is required
    if (body.number.length > 5) {
      return c.json(
        {
          error: "ValidationError",
          message: "number must be at most 5 characters long",
          params: ["number"],
        },
        400,
      );
    }

    // Validation: ExistingGiftCardNumber
    if (!balances.hasOwnProperty(number)) {
      return c.text('', 404);
    }

    // Handlers logic
    return c.json({ balance: balances[number] });
  } catch (err) {
    return c.json({ error: "Invalid Request" }, 400);
  }
});

// POST /gift_cards/capture
giftCards.post("/capture", async (c) => {
  try {
    const body = await c.req.json();
    const number = String(body.number);
    const amount = parseFloat(body.amount);

    // Validation: ExistingGiftCardNumber
    if (!balances.hasOwnProperty(number)) {
      return c.text('', 404);
    }

    // Validation: AvailableBalanceSufficient
    if (isNaN(amount)) {
      return c.json(
        {
          error: "ValidationError",
          message: "amount must be a number",
          params: ["amount"],
        },
        400,
      );
    }

    if (balances[number] < amount) {
      return c.json(
        {
          error: "ValidationError",
          message: "must be less than or equal to the current balance",
          params: ["amount"],
        },
        400,
      );
    }

    // update_balance(params[:number], -params[:amount])
    balances[number] -= amount;
    return c.json({ balance: balances[number] });
  } catch (err) {
    return c.json({ error: "Invalid Request" }, 400);
  }
});

// POST /gift_cards/refund
giftCards.post("/refund", async (c) => {
  try {
    const body = await c.req.json();
    const number = String(body.number);
    const amount = parseFloat(body.amount);

    // requires :number
    // requires :amount, type: Float
    if (!number) {
      return c.json(
        {
          error: "ValidationError",
          message: "number is required",
          params: ["number"],
        },
        400,
      );
    }

    // Validation: ExistingGiftCardNumber
    if (!balances.hasOwnProperty(number)) {
      return c.text('', 404);
    }

    if (isNaN(amount)) {
      return c.json(
        {
          error: "ValidationError",
          message: "amount must be a number",
          params: ["amount"],
        },
        400,
      );
    }

    // update_balance(params[:number], params[:amount])
    // Mimic Hash default 0 behavior if key doesn't exist
    if (!balances.hasOwnProperty(number)) {
      balances[number] = 0;
    }

    balances[number] += amount;
    return c.json({ balance: balances[number] });
  } catch (err) {
    return c.json({ error: "Invalid Request" }, 400);
  }
});

// POST /gift_cards/void
giftCards.post("/void", async (c) => {
  try {
    const body = await c.req.json();
    const number = String(body.number);
    const amount = parseFloat(body.amount);

    // Validation: ExistingGiftCardNumber
    if (!balances.hasOwnProperty(number)) {
      return c.text('', 404);
    }

    if (isNaN(amount)) {
      return c.json(
        {
          error: "ValidationError",
          message: "amount must be a number",
          params: ["amount"],
        },
        400,
      );
    }

    balances[number] += amount;

    // Handlers logic
    return c.json({ balance: balances[number] });
  } catch (err) {
    return c.json({ error: "Invalid Request" }, 400);
  }
});

app.route("/gift_cards", giftCards);


// resource :custom_payment
const customPayment = new Hono();

['capture', 'refund', 'void'].forEach((base_path) => {
  customPayment.post(base_path, async (c) => {
    return c.json({ message: 'Success' }, 200);
  });

  customPayment.post(`/${base_path}_error`, async (c) => {
    return c.json({ message: "Error example with message key" }, 400);
  });

  customPayment.post(`/${base_path}_error_json`, async (c) => {
    return c.json({ error: "Error example without message key" }, 422);
  });

  customPayment.post(`/${base_path}_error_text`, async (c) => {
    return c.text("Error example is not JSON", 500);
  });
});

app.route("/custom_payment", customPayment);

app.notFound((c) => {
  return c.text("Forbidden", 403);
});

export default app;
