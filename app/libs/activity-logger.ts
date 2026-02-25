import { NextRequest } from 'next/server';
import { connectDB } from './mongoConnect';
import Activity from '../models/Activity';
import Session from '../models/Session'; // optional, if you have session model

interface LogActivityParams {
  userId: string;
  action: string;
  request: NextRequest;
  metadata?: any;
}

export async function logActivity({
  userId,
  action,
  request,
  metadata,
}: LogActivityParams) {
  try {
    await connectDB();

    // 1️⃣ Get user agent and parse device
    const userAgent = request.headers.get('user-agent') || '';
    const device = parseUserAgent(userAgent);

    // 2️⃣ Get IP address
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'Unknown';

    // 3️⃣ Get location from IP (basic placeholder)
    const location = await getLocationFromIP(ipAddress);

    // 4️⃣ Save activity
    await Activity.create({
      userId,
      action,
      device,
      location,
      ipAddress,
      userAgent,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}

// ---------------- Helper functions ----------------

function parseUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome')) {
    if (userAgent.includes('Windows')) return 'Chrome on Windows';
    if (userAgent.includes('Mac')) return 'Chrome on MacOS';
    if (userAgent.includes('Linux')) return 'Chrome on Linux';
    if (userAgent.includes('Android')) return 'Chrome on Android';
    return 'Chrome';
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    if (userAgent.includes('iPhone')) return 'Safari on iPhone';
    if (userAgent.includes('iPad')) return 'Safari on iPad';
    if (userAgent.includes('Mac')) return 'Safari on MacOS';
    return 'Safari';
  }
  if (userAgent.includes('Firefox')) {
    if (userAgent.includes('Windows')) return 'Firefox on Windows';
    if (userAgent.includes('Mac')) return 'Firefox on MacOS';
    if (userAgent.includes('Linux')) return 'Firefox on Linux';
    return 'Firefox';
  }
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';

  return 'Unknown device';
}

async function getLocationFromIP(ipAddress: string): Promise<string> {
  // For localhost/dev
  if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'Unknown') {
    return 'Local Development';
  }

  try {
    // Example using a public IP API (uncomment in production)
    /*
    const res = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await res.json();
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    }
    */
    return 'Unknown location';
  } catch (error) {
    console.error('Geolocation error:', error);
    return 'Unknown location';
  }
}
