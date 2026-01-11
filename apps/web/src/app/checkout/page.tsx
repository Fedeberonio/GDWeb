import { CheckoutClient } from "./checkout-client";
import { PrimaryNav } from "../_components/primary-nav";
import { Container } from "../_components/container";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PrimaryNav />
      <main className="py-8">
        <Container>
          <CheckoutClient />
        </Container>
      </main>
    </div>
  );
}
