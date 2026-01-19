import { Hono } from "hono";

const app = new Hono();

// In-memory version of GIFT_CARD_BALANCES
// Ruby: GIFT_CARD_BALANCES = Hash.new { |hash, key| hash[key] = 0 }
const balances: Record<string, number> = {
  "1": 10000,
  "2": 10,
  "3": 0,
};

app.get("/", (c) => {
  return c.text("Springboard Retail Webhooks Mock API");
});

// resource :gift_cards
const giftCards = new Hono();

// POST /gift_cards/check_balance
giftCards.post("/check_balance", async (c) => {
  try {
    const body = await c.req.json();
    const number = String(body.number);

    // Validation: ExistingGiftCardNumber
    // requires :number, existing_gift_card_number: true
    if (!balances.hasOwnProperty(number)) {
      return c.json(
        {
          error: "ValidationError",
          message: "must be an existing gift card number",
          params: ["number"],
        },
        400,
      );
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
    // requires :number, existing_gift_card_number: true
    if (!balances.hasOwnProperty(number)) {
      return c.json(
        {
          error: "ValidationError",
          message: "must be an existing gift card number",
          params: ["number"],
        },
        400,
      );
    }

    // Validation: AvailableBalanceSufficient
    // requires :amount, type: Float, available_balance_sufficient: true
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

app.route("/gift_cards", giftCards);

export default app;
