export function Avatar({
  username,
  image,
  size,
}: {
  username: string;
  image?: string;
  size?: "sm" | "xl";
}) {
  const sizeClass = size ? ` avatar-${size}` : "";
  if (image) {
    return <img src={image} alt="" className={`avatar${sizeClass}`} />;
  }
  return (
    <span className={`avatar avatar-fallback${sizeClass}`}>
      {username[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
