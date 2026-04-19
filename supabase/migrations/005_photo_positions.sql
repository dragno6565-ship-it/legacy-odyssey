-- Migration: Add photo_positions JSONB column to books table
-- This stores focal point (x, y) percentages per photo storage path.
-- Used by the mobile app's PhotoEditor "Adjust Photo" feature.
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS photo_positions JSONB NOT NULL DEFAULT '{}';
