// Deprecated shim — OTP is now handled by Supabase Auth via src/lib/auth.ts.
// Kept temporarily so existing imports compile during migration.
export function generateOtp(_email: string) {}
export function verifyOtp(_email: string, _code: string) { return false; }
