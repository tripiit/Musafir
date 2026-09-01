"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@/components/ui/Icon";
import { initialsOf } from "@/lib/format";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validation";

// Same input styling as the trip form, per the design system.
const inputClass =
  "w-full rounded-md border border-surface-dim bg-surface px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-stack-sm block text-label-md text-on-surface";
const errorClass = "mt-stack-xs flex items-center gap-1 text-label-sm text-error";

export function EditProfileForm({
  email,
  initialValues,
}: {
  email: string;
  initialValues: UpdateProfileInput;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialValues,
  });

  const photoUrl = useWatch({ control, name: "photoUrl" });
  const name = useWatch({ control, name: "name" });

  async function onPhotoPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSubmitError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not upload that photo.");
        return;
      }
      setValue("photoUrl", data.urls[0], { shouldValidate: true });
    } catch {
      setSubmitError("Could not upload that photo. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: UpdateProfileInput) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not save your profile.");
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setSubmitError("Could not reach the server. Check your connection.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-stack-lg rounded-lg border border-surface-container-highest bg-surface-container-lowest p-gutter shadow-card md:p-stack-lg"
      noValidate
    >
      {/* Photo */}
      <section className="flex flex-col items-center gap-stack-md">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-surface-variant">
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary-container font-heading text-headline-lg text-on-primary-container">
              {initialsOf(name || "?")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border border-outline-variant px-4 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-low">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPhotoPicked}
              disabled={uploading}
            />
            {uploading ? "Uploading..." : photoUrl ? "Replace photo" : "Add photo"}
          </label>
          {photoUrl && (
            <button
              type="button"
              onClick={() => setValue("photoUrl", null, { shouldValidate: true })}
              className="rounded-md px-3 py-2 text-label-md text-error transition-colors hover:bg-error-container"
            >
              Remove
            </button>
          )}
        </div>
      </section>

      <section>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input id="name" {...register("name")} className={inputClass} placeholder="Your name" />
        {errors.name && (
          <p className={errorClass}>
            <Icon name="warning" size={14} />
            {errors.name.message}
          </p>
        )}
      </section>

      {/* Email: shown for confidence, locked because it anchors the whole
          institute-domain restriction and changing it would need re-verification. */}
      <section>
        <label className={labelClass} htmlFor="email">
          Institute Email
        </label>
        <div className="relative">
          <input
            id="email"
            value={email}
            disabled
            readOnly
            className={`${inputClass} cursor-not-allowed bg-surface-container pr-10 text-outline`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-outline">
            <Icon name="lock" size={18} />
          </span>
        </div>
        <p className="mt-stack-xs flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Icon name="info" size={14} />
          Institute email can&apos;t be changed — it&apos;s verified at signup.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-stack-md sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="age">
            Age
          </label>
          <Controller
            control={control}
            name="age"
            render={({ field }) => (
              <input
                id="age"
                type="number"
                min={16}
                max={80}
                placeholder="20"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : Number(e.target.value))
                }
                className={inputClass}
              />
            )}
          />
          {errors.age && (
            <p className={errorClass}>
              <Icon name="warning" size={14} />
              {errors.age.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="branch">
            Branch
          </label>
          <Controller
            control={control}
            name="branch"
            render={({ field }) => (
              <input
                id="branch"
                placeholder="B.Tech CSE"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                className={inputClass}
              />
            )}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="batchYear">
            Batch year
          </label>
          <Controller
            control={control}
            name="batchYear"
            render={({ field }) => (
              <input
                id="batchYear"
                type="number"
                min={1990}
                placeholder="2024"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : Number(e.target.value))
                }
                className={inputClass}
              />
            )}
          />
          {errors.batchYear && (
            <p className={errorClass}>
              <Icon name="warning" size={14} />
              {errors.batchYear.message}
            </p>
          )}
        </div>
      </div>

      <section>
        <label className={labelClass} htmlFor="bio">
          Bio
        </label>
        <Controller
          control={control}
          name="bio"
          render={({ field }) => (
            <textarea
              id="bio"
              rows={4}
              placeholder="A line or two about the kind of trips you like — other students see this on your trips."
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
              className={`${inputClass} resize-none`}
            />
          )}
        />
        {errors.bio && (
          <p className={errorClass}>
            <Icon name="warning" size={14} />
            {errors.bio.message}
          </p>
        )}
      </section>

      {submitError && (
        <p role="alert" className={errorClass}>
          <Icon name="warning" size={14} />
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-stack-sm sm:flex-row-reverse">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-4 text-label-md text-on-primary shadow-card transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-60"
        >
          <Icon
            name={isSubmitting ? "progress_activity" : "check_circle"}
            size={20}
            className={isSubmitting ? "animate-spin" : ""}
          />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <Link
          href="/profile"
          className="flex w-full items-center justify-center rounded-md border border-outline-variant py-4 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container sm:w-auto sm:px-8"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
