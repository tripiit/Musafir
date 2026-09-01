import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Where are we heading? · TripMate IITM" };

/**
 * The intent fork from the original brief, kept as its own step rather than
 * folded into the dashboard.
 */
export default function HomeSelectionPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-margin-mobile py-stack-lg md:min-h-screen md:px-margin-desktop">
      <div className="mb-stack-lg text-center md:mb-12">
        <h1 className="mb-stack-sm font-heading text-headline-lg-mobile text-primary md:text-headline-lg">
          Where are we heading?
        </h1>
        <p className="mx-auto max-w-lg text-body-md text-on-surface-variant">
          Coordinate your travel to and from the IIT Mandi campus seamlessly.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-gutter md:grid-cols-2">
        <Link
          href="/trips/new"
          className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest p-8 shadow-card transition-all duration-300 hover:shadow-card-hover focus:ring-2 focus:ring-primary focus:outline-none active:scale-95"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-primary-fixed/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <div className="z-10 mb-6 flex h-20 w-20 transform items-center justify-center rounded-full bg-primary text-on-primary shadow-card-hover transition-transform duration-300 group-hover:-translate-y-2">
            <Icon name="add" size={40} strokeWidth={2.5} />
          </div>
          <div className="z-10 text-center">
            <h2 className="mb-2 font-heading text-headline-md text-primary">Create a Trip</h2>
            <p className="text-body-md text-on-surface-variant">Add your own adventure</p>
          </div>
          <div
            aria-hidden
            className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary-fixed/20 blur-2xl transition-transform duration-700 group-hover:scale-150"
          />
        </Link>

        <Link
          href="/browse"
          className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest p-8 shadow-card transition-all duration-300 hover:shadow-card-hover focus:ring-2 focus:ring-secondary-container focus:outline-none active:scale-95"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-secondary-fixed/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <div className="z-10 mb-6 flex h-20 w-20 transform items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-card-hover transition-transform duration-300 group-hover:-translate-y-2">
            <Icon name="explore" size={40} />
          </div>
          <div className="z-10 text-center">
            <h2 className="mb-2 font-heading text-headline-md text-primary">Browse Trips</h2>
            <p className="text-body-md text-on-surface-variant">Find trips led by others</p>
          </div>
          <div
            aria-hidden
            className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-secondary-fixed/20 blur-2xl transition-transform duration-700 group-hover:scale-150"
          />
        </Link>
      </div>
    </main>
  );
}
