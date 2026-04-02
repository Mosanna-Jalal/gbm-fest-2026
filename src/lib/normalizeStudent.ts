export function normalizeNameAndClassRoll(name: string, classRoll: string) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanClassRoll = classRoll.trim().replace(/\s+/g, " ");

  const match = cleanClassRoll.match(
    /^([A-Za-z.]{2,}(?:\s+[A-Za-z.]{2,})?)\s+(\d+(?:st|nd|rd|th)\s+Sem\s*\/\s*.+)$/i
  );

  if (!match) {
    return { name: cleanName, classRoll: cleanClassRoll, changed: false };
  }

  const surnamePart = match[1].trim();
  const normalizedClassRoll = match[2].trim();

  if (cleanName.toLowerCase().includes(surnamePart.toLowerCase())) {
    return { name: cleanName, classRoll: normalizedClassRoll, changed: true };
  }

  return {
    name: `${cleanName} ${surnamePart}`.replace(/\s+/g, " ").trim(),
    classRoll: normalizedClassRoll,
    changed: true,
  };
}
