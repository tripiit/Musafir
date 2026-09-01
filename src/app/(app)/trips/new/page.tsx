import { TripForm } from "@/components/trips/TripForm";

export const metadata = { title: "Create a trip · TripMate IITM" };

export default function NewTripPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-stack-lg">
        <h1 className="mb-stack-sm font-heading text-headline-lg-mobile text-primary md:text-headline-lg">
          Create New Trip
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Fill in the details to find travel buddies for your next Himalayan adventure.
        </p>
      </div>
      <TripForm mode="create" />
    </main>
  );
}
