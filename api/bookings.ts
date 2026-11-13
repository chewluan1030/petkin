import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
}

interface ServerlessResponse extends ServerResponse {
  status?: (code: number) => ServerlessResponse;
  json?: (data: unknown) => void;
}

const HOTELS: Record<
  number,
  { name: string; rooms: Record<string, { species: string; pricePerNight: number }> }
> = {
  1: {
    name: 'PetKin Sanctuary Suites',
    rooms: {
      'Dog Sanctuary Suite': { species: 'Dog', pricePerNight: 78 },
      'Cat Sunlit Wing Condo': { species: 'Cat', pricePerNight: 52 },
    },
  },
  2: {
    name: 'PetKin Harbour Lodge',
    rooms: {
      'Garden Rest Dog Cabin': { species: 'Dog', pricePerNight: 72 },
      'Skyline Feline Loft': { species: 'Cat', pricePerNight: 48 },
    },
  },
};

const GROOMERS: Record<
  number,
  { name: string; slots: string[]; packages: Record<string, number> }
> = {
  1: {
    name: 'PetKin Calm Grooming Studio',
    slots: ['10:00 AM', '1:30 PM', '4:30 PM'],
    packages: {
      'Basic Grooming': 55,
      'Full Grooming': 85,
      'Bath & Blow Dry': 45,
      'Nail Trimming': 25,
    },
  },
  2: {
    name: 'PetKin East Coast Care Studio',
    slots: ['09:30 AM', '12:30 PM', '3:30 PM'],
    packages: {
      'Basic Grooming': 58,
      'Full Grooming': 88,
      'Bath & Blow Dry': 48,
      'Nail Trimming': 25,
    },
  },
};

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    const next = res.status(statusCode);
    if (typeof next.json === 'function') {
      next.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readBody(req: ServerlessRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return req.body.trim()
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : {};
    }
    if (typeof req.body === 'object') {
      return req.body as Record<string, unknown>;
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  try {
    const body = await readBody(req);
    const serviceType = body.serviceType === 'hotel' ? 'hotel' : 'grooming';
    const providerId = Number(body.providerId);
    const serviceName = String(body.serviceName || '').trim();
    const customerName = String(body.customerName || '').trim();
    const customerEmail = String(body.customerEmail || '').trim();
    const contactNumber = String(body.contactNumber || '').trim();
    const petName = String(body.petName || '').trim();
    const petType = body.petType === 'Cat' ? 'Cat' : 'Dog';
    const checkInDate = String(body.checkInDate || '').trim();
    const checkOutDate = body.checkOutDate ? String(body.checkOutDate).trim() : undefined;
    const timeSlot = body.timeSlot ? String(body.timeSlot).trim() : undefined;
    const additionalRequirements = body.additionalRequirements
      ? String(body.additionalRequirements).trim()
      : null;
    const addExtra = Boolean(body.addEnrichmentOrLateCare);

    if (
      !providerId ||
      !serviceName ||
      !customerName ||
      !customerEmail ||
      !contactNumber ||
      !petName ||
      !checkInDate
    ) {
      sendJson(res, 400, {
        error: 'Please complete all required customer, pet, service, and date fields.',
      });
      return;
    }

    let providerName = '';
    let basePrice = 0;
    let nights = 1;

    if (serviceType === 'hotel') {
      if (!checkOutDate || checkOutDate <= checkInDate) {
        sendJson(res, 400, {
          error: 'Check-out date must be after check-in date.',
        });
        return;
      }
      const hotel = HOTELS[providerId];
      if (!hotel) {
        sendJson(res, 400, { error: 'Selected pet hotel was not found.' });
        return;
      }
      const room = hotel.rooms[serviceName];
      if (!room) {
        sendJson(res, 400, { error: 'Selected room type was not found.' });
        return;
      }
      if (room.species !== petType) {
        sendJson(res, 400, {
          error: `${serviceName} is configured for ${room.species} guests only.`,
        });
        return;
      }
      providerName = hotel.name;
      const startMs = new Date(checkInDate).getTime();
      const endMs = new Date(checkOutDate).getTime();
      nights = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
      basePrice = room.pricePerNight * nights;
    } else {
      if (!timeSlot) {
        sendJson(res, 400, { error: 'Please choose an appointment time slot.' });
        return;
      }
      const groomer = GROOMERS[providerId];
      if (!groomer) {
        sendJson(res, 400, { error: 'Selected grooming studio was not found.' });
        return;
      }
      const pkgPrice = groomer.packages[serviceName];
      if (pkgPrice === undefined) {
        sendJson(res, 400, { error: 'Selected grooming package was not found.' });
        return;
      }
      providerName = groomer.name;
      basePrice = pkgPrice;
    }

    const additionalCharges = addExtra ? 15 : 0;
    const bookingFee = 4.5;
    const discountAmount = 0;
    const totalPayable = Number(
      (basePrice + additionalCharges + bookingFee).toFixed(2)
    );
    const referenceCode = `PK-${Date.now().toString().slice(-6)}-${Math.floor(
      10 + Math.random() * 89
    )}`;

    sendJson(res, 201, {
      booking: {
        id: Date.now(),
        referenceCode,
        serviceType,
        providerId,
        providerName,
        serviceName,
        customerName,
        customerEmail,
        contactNumber,
        petName,
        petType,
        checkInDate,
        checkOutDate: serviceType === 'hotel' ? checkOutDate || null : null,
        timeSlot: serviceType === 'grooming' ? timeSlot || null : null,
        nights,
        additionalRequirements,
        basePrice,
        additionalCharges,
        bookingFee,
        discountAmount,
        totalPayable,
        status: 'Pending',
        cancellationRequested: false,
        cancellationReason: null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to create booking request.';
    sendJson(res, 500, { error: message });
  }
}
