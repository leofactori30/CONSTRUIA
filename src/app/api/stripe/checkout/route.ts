import { STRIPE_PRICES } from "@/lib/stripe";

export async function POST(request: Request) {
  const { plan, email, full_name, cpf } = await request.json();

  const priceId = STRIPE_PRICES[plan as string];

  if (!priceId) {
    return Response.json({ error: "Plano inválido." }, { status: 400 });
  }

  if (!email) {
    return Response.json({ error: "E-mail é obrigatório." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${appUrl}/app/chat?checkout=success`,
    cancel_url: `${appUrl}/?checkout=cancelled`,
    customer_email: email,
    "metadata[full_name]": full_name ?? "",
    "metadata[cpf]": cpf ?? "",
    "metadata[plan]": plan,
  });

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return Response.json({ error: session.error?.message ?? "Falha ao criar sessão de pagamento." }, { status: 400 });
  }

  return Response.json({ url: session.url });
}
