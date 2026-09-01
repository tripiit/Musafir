import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { requireUser } from "@/lib/auth";
import type { UpdateProfileInput } from "@/lib/validation";

export const metadata = { title: "Edit profile · TripMate IITM" };

export default async function EditProfilePage() {
  const user = await requireUser();

  const initialValues: UpdateProfileInput = {
    name: user.name,
    age: user.age,
    branch: user.branch,
    batchYear: user.batchYear,
    bio: user.bio,
    photoUrl: user.photoUrl,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <Link
        href="/profile"
        className="mb-stack-md inline-flex items-center gap-1 text-label-md text-on-surface-variant transition-colors hover:text-primary"
      >
        <Icon name="chevron_left" size={18} />
        Back to profile
      </Link>

      <div className="mb-stack-lg">
        <h1 className="mb-stack-sm font-heading text-headline-lg-mobile text-primary md:text-headline-lg">
          Edit Profile
        </h1>
        <p className="text-body-md text-on-surface-variant">
          This is what other students see on the trips you organize.
        </p>
      </div>

      <EditProfileForm email={user.email} initialValues={initialValues} />
    </main>
  );
}
