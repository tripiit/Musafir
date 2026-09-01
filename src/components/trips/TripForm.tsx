"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@/components/ui/Icon";
import { TravelModeIcon } from "@/components/ui/TravelModeIcon";
import {
  MAX_TRIP_IMAGES,
  MIN_TRIP_IMAGES,
  TRAVEL_MODES,
  TRAVEL_MODE_LABELS,
  type TravelMode,
} from "@/lib/constants";
import { formatDuration, tripDurationDays } from "@/lib/format";
import { createTripSchema, type CreateTripInput } from "@/lib/validation";

const inputClass =
  "w-full rounded-md border border-surface-dim bg-surface px-4 py-3 text-body-md text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";
const labelClass = "mb-stack-sm block text-label-md text-on-surface";
const errorClass = "mt-stack-xs flex items-center gap-1 text-label-sm text-error";

export type TripFormMode = "create" | "edit";

/**
 * One form for both /trips/new and /trips/[id]/edit — the edit screen passes
 * the trip's current values as defaults rather than duplicating the markup.
 */
export function TripForm({
  mode = "create",
  tripId,
  initialValues,
}: {
  mode?: TripFormMode;
  tripId?: string;
  initialValues?: CreateTripInput;
} = {}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = mode === "edit";

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
    defaultValues: initialValues ?? {
      title: "",
      stops: [{ location: "", arrivalDate: "" }],
      departureDate: "",
      departureLocation: "IIT Mandi Campus",
      returnDate: "",
      returnLocation: "IIT Mandi Campus",
      images: [],
      groupSizeFlexible: false,
      groupSizeMax: 2,
      travelModes: ["bike"],
      description: "",
    },
  });

  const {
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
    move: moveStop,
  } = useFieldArray({ control, name: "stops" });

  // useWatch rather than watch(): it subscribes per-field and stays compatible
  // with the React Compiler, which refuses to memoize a component using watch().
  const images = useWatch({ control, name: "images" });
  const groupSizeFlexible = useWatch({ control, name: "groupSizeFlexible" });
  const groupSizeMax = useWatch({ control, name: "groupSizeMax" });
  const departureDate = useWatch({ control, name: "departureDate" });
  const returnDate = useWatch({ control, name: "returnDate" });
  const travelModes = useWatch({ control, name: "travelModes" });

  // Live preview of the value the server will compute from these two dates.
  const derivedDuration = tripDurationDays(
    departureDate ? new Date(departureDate) : null,
    returnDate ? new Date(returnDate) : null,
  );

  async function onFilesPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = ""; // let the same file be re-picked after a removal
    if (picked.length === 0) return;

    const room = MAX_TRIP_IMAGES - images.length;
    if (room <= 0) {
      setSubmitError(`You can add up to ${MAX_TRIP_IMAGES} photos.`);
      return;
    }

    setSubmitError(null);
    setUploading(true);
    try {
      const body = new FormData();
      picked.slice(0, room).forEach((file) => body.append("files", file));

      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not upload those photos.");
        return;
      }

      setValue(
        "images",
        [
          ...images,
          ...data.urls.map((url: string) => ({ url, alt: "" })),
        ].slice(0, MAX_TRIP_IMAGES),
        { shouldValidate: true },
      );
    } catch {
      setSubmitError("Could not upload those photos. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setValue(
      "images",
      images.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  }

  function toggleMode(mode: TravelMode) {
    const next = travelModes.includes(mode)
      ? travelModes.filter((m) => m !== mode)
      : [...travelModes, mode];
    setValue("travelModes", next, { shouldValidate: true });
  }

  async function onSubmit(values: CreateTripInput) {
    setSubmitError(null);
    try {
      const res = await fetch(isEdit ? `/api/trips/${tripId}` : "/api/trips", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? `Could not ${isEdit ? "save" : "post"} the trip.`);
        return;
      }
      router.push(`/trips/${data.id}`);
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
      {/* 1. Photos */}
      <section className="space-y-stack-sm">
        <span className={labelClass}>
          Trip Photos ({images.length}/{MAX_TRIP_IMAGES})
        </span>
        <div className="no-scrollbar flex snap-x gap-stack-md overflow-x-auto pb-2">
          {images.length < MAX_TRIP_IMAGES && (
            <label className="flex h-32 w-32 shrink-0 cursor-pointer snap-start flex-col items-center justify-center rounded-md border-2 border-dashed border-outline-variant bg-surface text-on-surface-variant transition-all hover:bg-surface-container-low active:scale-[0.98] md:h-40 md:w-40">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={onFilesPicked}
                disabled={uploading}
              />
              <Icon
                name={uploading ? "progress_activity" : "add_a_photo"}
                size={32}
                className={`mb-2 text-primary-container ${uploading ? "animate-spin" : ""}`}
              />
              <span className="text-label-sm">{uploading ? "Uploading..." : "Add Photos"}</span>
            </label>
          )}

          {images.map((image, index) => (
            <div
              key={image.url}
              className="group relative h-32 w-32 shrink-0 snap-start overflow-hidden rounded-md shadow-sm md:h-40 md:w-40"
            >
              <Image src={image.url} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute top-2 right-2 rounded-full bg-surface/80 p-1 text-error opacity-100 backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              >
                <Icon name="close" size={16} />
              </button>
              {/* Real alt text, not the generator prompt the mockups carried. */}
              <input
                {...register(`images.${index}.alt` as const)}
                placeholder="Describe this photo"
                aria-label={`Description for photo ${index + 1}`}
                className="absolute inset-x-0 bottom-0 border-none bg-black/55 px-2 py-1.5 text-label-sm text-white placeholder:text-white/70 focus:bg-black/75 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Add {MIN_TRIP_IMAGES}-{MAX_TRIP_IMAGES} photos of the destination, and describe each one.
        </p>
        {errors.images && (
          <p className={errorClass}>
            <Icon name="warning" size={14} />
            {errors.images.message ?? errors.images.root?.message ?? "Check the photo descriptions."}
          </p>
        )}
      </section>

      {/* 2. Title + destination + date */}
      <section className="space-y-stack-md">
        <div>
          <label className={labelClass} htmlFor="title">
            Trip Title
          </label>
          <input
            id="title"
            {...register("title")}
            placeholder="e.g. Weekend trek to Prashar Lake"
            className={inputClass}
          />
          {errors.title && (
            <p className={errorClass}>
              <Icon name="warning" size={14} />
              {errors.title.message}
            </p>
          )}
        </div>

      </section>

      {/* 2b. The Plan — departure, stops, return. Duration is not a field
          here: it is derived from the two dates and shown read-only below. */}
      <section className="space-y-stack-md rounded-md border border-surface-container-highest bg-surface p-gutter">
        <div>
          <span className="font-heading text-headline-md text-primary">Plan</span>
          <p className="mt-stack-xs text-label-sm text-on-surface-variant">
            Where you leave from, everywhere you are stopping, and when you come back.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="departureDate">
              Departure date <span className="text-outline">(optional)</span>
            </label>
            <input
              id="departureDate"
              type="date"
              {...register("departureDate")}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="departureLocation">
              Departure from
            </label>
            <input
              id="departureLocation"
              {...register("departureLocation")}
              placeholder="IIT Mandi Campus"
              className={inputClass}
            />
          </div>
        </div>

        {/* Stops repeater. The first row is the primary destination and keeps
            the original single-field UX; extra stops add an optional date. */}
        <div className="space-y-stack-sm">
          {stopFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-md border border-surface-container-highest bg-surface-container-lowest p-stack-md"
            >
              <div className="mb-stack-sm flex items-center justify-between gap-2">
                <span className="text-label-md text-on-surface">
                  {index === 0 ? "Destination" : `Stop ${index + 1}`}
                </span>

                {index > 0 && (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveStop(index, index - 1)}
                      aria-label={`Move stop ${index + 1} earlier`}
                      className="rounded-sm p-1 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-30"
                    >
                      <Icon name="arrow_upward" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStop(index, index + 1)}
                      disabled={index === stopFields.length - 1}
                      aria-label={`Move stop ${index + 1} later`}
                      className="rounded-sm p-1 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-30"
                    >
                      <Icon name="arrow_downward" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      aria-label={`Remove stop ${index + 1}`}
                      className="rounded-sm p-1 text-error transition-colors hover:bg-error-container"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </span>
                )}
              </div>

              <div
                className={index === 0 ? "" : "grid grid-cols-1 gap-stack-md md:grid-cols-2"}
              >
                <div>
                  <label className="sr-only" htmlFor={`stop-${index}-location`}>
                    {index === 0 ? "Destination" : `Stop ${index + 1} location`}
                  </label>
                  <input
                    id={`stop-${index}-location`}
                    {...register(`stops.${index}.location` as const)}
                    placeholder={index === 0 ? "e.g. Prashar Lake" : "e.g. Kasol"}
                    className={inputClass}
                  />
                  {errors.stops?.[index]?.location && (
                    <p className={errorClass}>
                      <Icon name="warning" size={14} />
                      {errors.stops[index]?.location?.message}
                    </p>
                  )}
                </div>

                {index > 0 && (
                  <div>
                    <label className="sr-only" htmlFor={`stop-${index}-date`}>
                      Arrive on
                    </label>
                    <input
                      id={`stop-${index}-date`}
                      type="date"
                      {...register(`stops.${index}.arrivalDate` as const)}
                      aria-label={`Arrive at stop ${index + 1} on`}
                      className={inputClass}
                    />
                    {errors.stops?.[index]?.arrivalDate && (
                      <p className={errorClass}>
                        <Icon name="warning" size={14} />
                        {errors.stops[index]?.arrivalDate?.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {errors.stops?.root && (
            <p className={errorClass}>
              <Icon name="warning" size={14} />
              {errors.stops.root.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => appendStop({ location: "", arrivalDate: "" })}
            className="flex items-center gap-1 rounded-md border border-dashed border-outline-variant px-4 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-low"
          >
            <Icon name="add" size={16} />
            Add another stop
          </button>
        </div>

        <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="returnDate">
              Return date <span className="text-outline">(optional)</span>
            </label>
            <input id="returnDate" type="date" {...register("returnDate")} className={inputClass} />
            {errors.returnDate && (
              <p className={errorClass}>
                <Icon name="warning" size={14} />
                {errors.returnDate.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="returnLocation">
              Return to
            </label>
            <input
              id="returnLocation"
              {...register("returnLocation")}
              placeholder="IIT Mandi Campus"
              className={inputClass}
            />
          </div>
        </div>

        <p
          aria-live="polite"
          className="flex items-center gap-2 rounded-md bg-surface-container-low px-4 py-3 text-label-md text-on-surface-variant"
        >
          <Icon name="calendar_today" size={16} />
          {derivedDuration === null
            ? "Duration: to be decided — add both dates to set it"
            : `Duration: ${formatDuration(derivedDuration)}`}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
        {/* 3. Group size */}
        <section>
          <span className={labelClass}>Group Size Required</span>
          <div className="flex items-center justify-between rounded-md border border-surface-dim bg-surface p-2">
            <button
              type="button"
              aria-label="Decrease group size"
              disabled={groupSizeFlexible}
              onClick={() =>
                setValue("groupSizeMax", Math.max(1, (groupSizeMax ?? 2) - 1), {
                  shouldValidate: true,
                })
              }
              className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high active:scale-95 disabled:opacity-40"
            >
              <Icon name="remove" size={20} />
            </button>
            <span
              aria-live="polite"
              className="w-16 text-center font-heading text-headline-md text-primary"
            >
              {groupSizeFlexible ? "—" : (groupSizeMax ?? 2)}
            </span>
            <button
              type="button"
              aria-label="Increase group size"
              disabled={groupSizeFlexible}
              onClick={() =>
                setValue("groupSizeMax", Math.min(10, (groupSizeMax ?? 2) + 1), {
                  shouldValidate: true,
                })
              }
              className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high active:scale-95 disabled:opacity-40"
            >
              <Icon name="add" size={20} />
            </button>
          </div>
          <Controller
            control={control}
            name="groupSizeFlexible"
            render={({ field }) => (
              <label className="mt-stack-sm flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked);
                    setValue("groupSizeMax", e.target.checked ? null : 2, {
                      shouldValidate: true,
                    });
                  }}
                  className="h-4 w-4 rounded-sm border-outline text-primary focus:ring-primary"
                />
                <span className="text-label-sm text-on-surface-variant">Flexible</span>
              </label>
            )}
          />
          {errors.groupSizeMax && (
            <p className={errorClass}>
              <Icon name="warning" size={14} />
              {errors.groupSizeMax.message}
            </p>
          )}
        </section>

      </div>

      {/* 5. Mode of travel */}
      <section>
        <span className={labelClass}>Mode of Travel</span>
        <div role="group" aria-label="Mode of travel" className="grid grid-cols-4 gap-2 md:gap-4">
          {TRAVEL_MODES.map((mode) => {
            const selected = travelModes.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleMode(mode)}
                className={`flex flex-col items-center justify-center rounded-md border p-3 transition-all duration-200 md:p-4 ${
                  selected
                    ? "border-primary-container bg-primary-container text-on-primary"
                    : "border-surface-dim bg-surface text-on-surface-variant hover:border-outline"
                }`}
              >
                <TravelModeIcon mode={mode} size={28} className="mb-1" />
                <span className="text-center text-label-sm">{TRAVEL_MODE_LABELS[mode]}</span>
              </button>
            );
          })}
        </div>
        {errors.travelModes && (
          <p className={errorClass}>
            <Icon name="warning" size={14} />
            {errors.travelModes.message}
          </p>
        )}
      </section>

      {/* 6. Description */}
      <section>
        <label className={labelClass} htmlFor="description">
          Detailed Description
        </label>
        <textarea
          id="description"
          rows={5}
          {...register("description")}
          placeholder="Share itinerary details, how costs will be split, specific requirements (e.g. experienced rider needed), or anything else potential travel buddies should know."
          className={`${inputClass} resize-none`}
        />
        {errors.description && (
          <p className={errorClass}>
            <Icon name="warning" size={14} />
            {errors.description.message}
          </p>
        )}
      </section>

      {submitError && (
        <p role="alert" className={errorClass}>
          <Icon name="warning" size={14} />
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-stack-sm pt-stack-md sm:flex-row-reverse">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-4 text-label-md text-on-primary shadow-card transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-60"
        >
          <Icon
            name={isSubmitting ? "progress_activity" : isEdit ? "check_circle" : "add_circle"}
            size={20}
            className={isSubmitting ? "animate-spin" : ""}
          />
          {isSubmitting ? (isEdit ? "Saving..." : "Posting...") : isEdit ? "Save Changes" : "Post Trip"}
        </button>

        {isEdit && (
          <Link
            href={`/trips/${tripId}`}
            className="flex w-full items-center justify-center rounded-md border border-outline-variant py-4 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container sm:w-auto sm:px-8"
          >
            Cancel
          </Link>
        )}
      </div>

      {isEdit && (
        <p className="text-label-sm text-on-surface-variant">
          Changing the Plan (dates, locations or the route) or the mode of travel notifies
          everyone with a live request for this trip.
        </p>
      )}
    </form>
  );
}
