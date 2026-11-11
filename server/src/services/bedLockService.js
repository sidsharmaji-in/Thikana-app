// Distributed Bed Slot Lock & Concurrency Engine (Slice P3 Production Architecture)
// Prevents double-booking race conditions during admission season with 10-minute lease holds

const repository = require('../data/repository');
const realtimeHub = require('../realtime/hub');

class BedLockService {
  constructor() {
    // key: `${propertyId}:${roomId}:${slotId}` -> lockRecord
    this.locks = new Map();
    this.DEFAULT_LEASE_SECONDS = 600; // 10 minutes lease
  }

  _makeKey(propertyId, roomId, slotId) {
    return `${propertyId}:${roomId}:${slotId}`;
  }

  // Attempt to acquire temporary 10-minute reservation lease
  acquireLock(propertyId, roomId, slotId, { lockedBy, tenantName = 'Student', tenantPhone = '', leaseSeconds = 600 } = {}) {
    if (!propertyId || !roomId || !slotId) {
      return { success: false, error: 'INVALID_PARAMETERS', message: 'propertyId, roomId, and slotId are required' };
    }

    const property = repository.getPropertyById(propertyId);
    if (!property) {
      return { success: false, error: 'PROPERTY_NOT_FOUND', message: 'Property not found' };
    }

    const room = property.rooms ? property.rooms.find(r => r.id === roomId) : null;
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND', message: 'Room not found' };
    }

    const slot = room.slots ? room.slots.find(s => s.slotId === slotId) : null;
    if (!slot) {
      return { success: false, error: 'SLOT_NOT_FOUND', message: 'Bed slot not found' };
    }

    // Check if slot is already permanently occupied
    if (slot.status === 'occupied') {
      return {
        success: false,
        error: 'SLOT_ALREADY_OCCUPIED',
        message: 'This bed slot is already permanently occupied'
      };
    }

    const key = this._makeKey(propertyId, roomId, slotId);
    const now = Date.now();
    const existing = this.locks.get(key);

    // Check if existing lock is active
    if (existing) {
      if (now < existing.expiresAt) {
        // Locked by the same user -> extend / refresh lease
        if (lockedBy && existing.lockedBy === lockedBy) {
          existing.expiresAt = now + (leaseSeconds * 1000);
          existing.remainingSeconds = leaseSeconds;
          
          realtimeHub.broadcast(`property:${propertyId}`, 'slot:lock_refreshed', {
            propertyId,
            roomId,
            slotId,
            expiresAt: new Date(existing.expiresAt).toISOString(),
            remainingSeconds: leaseSeconds
          });

          return {
            success: true,
            refreshed: true,
            lock: existing,
            message: 'Bed reservation lock lease refreshed'
          };
        }

        // Locked by another competitor -> Race condition intercepted! Return 409 Conflict
        const remainingSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
        return {
          success: false,
          error: 'SLOT_TEMPORARILY_LOCKED',
          status: 409,
          retryAfter: remainingSeconds,
          remainingSeconds,
          lockedBy: existing.lockedBy,
          message: `This bed is temporarily reserved by another student. Please check back in ${remainingSeconds} seconds or join the waitlist.`
        };
      } else {
        // Lock has expired -> auto-evict
        this.locks.delete(key);
      }
    }

    // Vacant and unlocked -> Acquire new lock atomically
    const leaseDuration = leaseSeconds || this.DEFAULT_LEASE_SECONDS;
    const expiresAt = now + (leaseDuration * 1000);

    const lockRecord = {
      key,
      propertyId,
      roomId,
      slotId,
      lockedBy: lockedBy || `guest-${Date.now()}`,
      tenantName,
      tenantPhone,
      lockedAt: new Date(now).toISOString(),
      expiresAt,
      remainingSeconds: leaseDuration
    };

    this.locks.set(key, lockRecord);

    // Broadcast live event to all clients viewing this property
    realtimeHub.broadcast(`property:${propertyId}`, 'slot:locked', {
      propertyId,
      roomId,
      slotId,
      lockedBy: lockRecord.lockedBy,
      expiresAt: new Date(expiresAt).toISOString(),
      remainingSeconds: leaseDuration
    });

    return {
      success: true,
      refreshed: false,
      lock: {
        ...lockRecord,
        expiresAt: new Date(expiresAt).toISOString()
      },
      message: `Bed slot reserved for ${Math.round(leaseDuration / 60)} minutes. Please complete details to confirm.`
    };
  }

  // Check lock status
  getLockStatus(propertyId, roomId, slotId, currentUserId = null) {
    const key = this._makeKey(propertyId, roomId, slotId);
    const existing = this.locks.get(key);
    const now = Date.now();

    if (!existing || now >= existing.expiresAt) {
      if (existing) this.locks.delete(key);
      return {
        isLocked: false,
        lockedByMe: false,
        remainingSeconds: 0
      };
    }

    const remainingSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
    return {
      isLocked: true,
      lockedByMe: Boolean(currentUserId && existing.lockedBy === currentUserId),
      remainingSeconds,
      expiresAt: new Date(existing.expiresAt).toISOString()
    };
  }

  // Release lock early (e.g. user cancels checkout or backs out)
  releaseLock(propertyId, roomId, slotId, requestedBy = null) {
    const key = this._makeKey(propertyId, roomId, slotId);
    const existing = this.locks.get(key);

    if (!existing) {
      return { success: true, message: 'Slot was not locked' };
    }

    // Verify requester has permission to release (lock holder or property owner)
    if (requestedBy && existing.lockedBy !== requestedBy && requestedBy !== 'owner' && requestedBy !== 'admin') {
      return {
        success: false,
        error: 'UNAUTHORIZED_RELEASE',
        message: 'Only the reserving student or property owner can release this bed lock early'
      };
    }

    this.locks.delete(key);

    // Broadcast live release event to all active clients
    realtimeHub.broadcast(`property:${propertyId}`, 'slot:released', {
      propertyId,
      roomId,
      slotId,
      releasedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Bed reservation lock released successfully'
    };
  }

  // Validate lock when completing final booking
  validateAndConsumeLock(propertyId, roomId, slotId, tenantIdentifier = null) {
    const key = this._makeKey(propertyId, roomId, slotId);
    const existing = this.locks.get(key);
    const now = Date.now();

    if (existing) {
      if (now < existing.expiresAt) {
        // If locked by someone else, prevent double-booking
        if (tenantIdentifier && existing.lockedBy !== tenantIdentifier &&
            existing.tenantPhone !== tenantIdentifier && existing.tenantName !== tenantIdentifier) {
          const remainingSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
          return {
            valid: false,
            error: 'SLOT_TEMPORARILY_LOCKED',
            retryAfter: remainingSeconds,
            message: `This bed is locked by another reservation. Expires in ${remainingSeconds}s.`
          };
        }
      }
      // Consume and clear lock upon confirmed booking
      this.locks.delete(key);
    }

    // Broadcast permanent booking event
    realtimeHub.broadcast(`property:${propertyId}`, 'slot:booked', {
      propertyId,
      roomId,
      slotId,
      timestamp: new Date().toISOString()
    });

    return { valid: true };
  }

  // Purge expired locks
  purgeExpired() {
    const now = Date.now();
    let purged = 0;
    for (const [key, lock] of this.locks.entries()) {
      if (now >= lock.expiresAt) {
        this.locks.delete(key);
        purged++;
      }
    }
    return purged;
  }

  getActiveLocksCount() {
    this.purgeExpired();
    return this.locks.size;
  }

  getStats() {
    this.purgeExpired();
    return {
      activeLocks: this.locks.size,
      leaseDurationSeconds: Math.round(this.leaseDurationMs / 1000)
    };
  }

  _clearAll() {
    this.locks.clear();
  }
}

// Global Singleton Service
const bedLockService = new BedLockService();

module.exports = bedLockService;

