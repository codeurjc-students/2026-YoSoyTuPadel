export function getWelcomeMessage(name: string | null | undefined): string {
  const displayName = name?.trim();
  return displayName ? `¡Qué alegría verte, ${displayName}!` : '¡Qué alegría verte!';
}
