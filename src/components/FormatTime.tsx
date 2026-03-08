interface Props {
  value: string | null;
}

export default function FormatTime({ value }: Props) {
  if (!value) return <>-</>;

  return (
    <>
      {new Date(value).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        // second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      })}
    </>
  );
}