export function TicketQr({ value }: { value: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
  return (
    <img
      src={src}
      alt={`QR билета ${value}`}
      width={180}
      height={180}
      className="size-[180px] bg-white"
    />
  );
}
