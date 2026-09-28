export function AccountScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 py-16 sm:px-6">
      <h1 className="font-medium uppercase tracking-[var(--ef-tracking-display)] text-foreground text-[clamp(1.5rem,4vw,2.5rem)]">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-[length:var(--ef-text-body)] font-light leading-normal text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
