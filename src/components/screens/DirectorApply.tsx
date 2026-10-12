import { DirectorApplicationForm } from "@/components/director-application-form";

export function DirectorApply() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-[length:var(--ef-text-section)] font-normal uppercase">
        Заявка
      </h1>
      <p className="mt-2 text-[length:var(--ef-text-body)] font-light text-muted-foreground">
        Черновик можно сохранить и дописать позже. Отправка фиксирует заявку на рассмотрении.
      </p>
      <div className="mt-8">
        <DirectorApplicationForm />
      </div>
    </div>
  );
}
