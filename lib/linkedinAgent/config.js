// lib/linkedinAgent/config.js
// Lazily creates the two singleton config rows (id="global") on first read,
// so there's no separate seed step required before the app is usable.
import { CONTROL_ROW_ID } from "./constants.js";

export async function getOrCreatePlatformConfig(prisma) {
  const existing = await prisma.platformConfig.findUnique({ where: { id: CONTROL_ROW_ID } });
  if (existing) return existing;
  return prisma.platformConfig.create({ data: { id: CONTROL_ROW_ID } });
}

export async function getOrCreatePublishingControl(prisma) {
  const existing = await prisma.publishingControl.findUnique({ where: { id: CONTROL_ROW_ID } });
  if (existing) return existing;
  return prisma.publishingControl.create({ data: { id: CONTROL_ROW_ID } });
}
