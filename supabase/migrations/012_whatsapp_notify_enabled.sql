-- ============================================================
-- HIVI — Migration 012: WhatsApp notify enabled toggle
-- Adds whatsapp_notify_enabled column to restaurants.
-- Default TRUE so existing restaurants keep receiving messages.
-- ============================================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS whatsapp_notify_enabled BOOLEAN NOT NULL DEFAULT TRUE;
