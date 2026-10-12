export function SiteFooter() {
  return (
    <footer id="footer" className="mx-auto w-full max-w-[var(--ef-content-width)] px-4 pb-10 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <img src="/brand/diamond.png" alt="" className="size-6 object-contain" />
        <img
          src="/brand/divider.svg"
          alt=""
          className="h-px min-w-0 flex-1 object-fill"
        />
        <img src="/brand/diamond.png" alt="" className="size-6 object-contain" />
      </div>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium uppercase text-[length:var(--ef-text-body)] tracking-[var(--ef-tracking-footer)]">
            Эфемерность
          </p>
          <p className="mt-2 text-[length:var(--ef-text-meta)] font-light text-muted-foreground">
            Контакты: Telegram, VK, Facebook — ссылки справа.
          </p>
          <p className="mt-1 text-[length:var(--ef-text-meta)] font-light text-muted-foreground">
            Партнёры: киношколы, независимые площадки, фестивальные команды.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <a href="https://t.me" aria-label="Telegram">
            <img src="/brand/icon-telegram.png" alt="" className="h-5 w-auto" />
          </a>
          <a href="https://vk.com" aria-label="VK">
            <img src="/brand/icon-vk.png" alt="" className="h-5 w-auto" />
          </a>
          <a href="https://facebook.com" aria-label="Facebook">
            <img
              src="/brand/icon-facebook.png"
              alt=""
              className="h-5 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
