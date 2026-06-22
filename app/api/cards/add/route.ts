import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../libs/mongoConnect";
import { Card } from "../../../models/Card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { stripe, isStripeEnabled } from "../../../libs/stripe";
import { addCardSchema } from "../../../libs/validators";
import { validate, readJson } from "../../../libs/validate";
import { enforce, limiters, clientIp } from "../../../libs/ratelimit";
import { log } from "../../../libs/logger";

const logger = log("cards/add");

/**
 * Expects { paymentMethodId, cardName }.
 * The client collects raw card data with Stripe Elements and creates a
 * PaymentMethod in the browser; only its id reaches our server.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await enforce(limiters.money, `card:${clientIp(req)}`);
    if (limited) return limited;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response!;
    const result = validate(addCardSchema, parsed.body);
    if (!result.ok) return result.response!;

    if (!isStripeEnabled || !stripe) {
      return NextResponse.json(
        { message: "Card payments are not configured. Add STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    const { paymentMethodId, cardName } = result.data!;

    // Retrieve the PaymentMethod to capture safe display fields.
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.type !== "card" || !pm.card) {
      return NextResponse.json({ message: "Invalid card payment method." }, { status: 400 });
    }

    await connectDB();
    const card = await Card.create({
      user: userId,
      cardName,
      stripePaymentMethodId: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    });

    // Return only safe fields.
    return NextResponse.json(
      {
        message: "Card added successfully",
        card: { id: card._id, brand: card.brand, last4: card.last4, cardName: card.cardName },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, "add card failed");
    return NextResponse.json({ message: "Failed to add card" }, { status: 500 });
  }
}
