/**
 * Domain order orchestration. Direct port of src/services/domainService.js's
 * purchaseAndSetupDomain pipeline, restructured for the Worker model:
 *
 * The Express version polls Spaceship inline for up to 5 minutes inside
 * a single HTTP request. Workers cap a request at ~30s wall clock, so
 * we split the orchestration into resumable steps stored on the
 * `domain_orders` row. A Cron Trigger advances each order one step per
 * tick (every minute). Status flow:
 *
 *   pending      → registering   (Spaceship registerDomain → operation_id)
 *   registering  → registered    (poll operation → success)
 *   registered   → vhosts_added  (Approximated addVirtualHost x2)
 *   vhosts_added → active        (Spaceship setupDns)
 *   any step → failed (with error_message + auto-renew disabled if registered)
 *
 * Each tick handles ONE order to keep cron runtime bounded. With Spaceship
 * registrations typically completing in 30-90s, a freshly-paid customer
 * goes from `pending` → `active` in two cron ticks (~2 minutes).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './supabase';
import { adminClient } from './supabase';
import {
  registerDomain,
  pollOperation,
  setupDns,
  setAutoRenew,
} from './spaceshipApi';
import { addVirtualHost } from './approximatedApi';
import { updateFamily } from './familyService';

type Order = Record<string, any>;

export async function createDomainOrder(
  supabase: SupabaseClient,
  args: {
    familyId: string;
    domain: string;
    stripeSessionId?: string | null;
    price?: number | null;
  }
): Promise<Order> {
  const tld = args.domain.split('.').slice(1).join('.');
  const { data, error } = await supabase
    .from('domain_orders')
    .insert({
      family_id: args.familyId,
      domain: args.domain,
      tld,
      status: 'pending',
      stripe_session_id: args.stripeSessionId || null,
      price_yearly: args.price ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

async function updateDomainOrder(
  supabase: SupabaseClient,
  orderId: string,
  fields: Record<string, any>
): Promise<Order> {
  const { data, error } = await supabase
    .from('domain_orders')
    .update(fields)
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

/**
 * Fetch up to N orders that need processing. The cron handler pulls one
 * batch per tick and advances each one step. Orders in `failed` or `active`
 * status are excluded — they're terminal.
 */
export async function fetchPendingOrders(
  supabase: SupabaseClient,
  limit = 10
): Promise<Order[]> {
  const { data } = await supabase
    .from('domain_orders')
    .select('*')
    .in('status', ['pending', 'registering', 'registered', 'vhosts_added'])
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data || []) as Order[];
}

/**
 * Advance ONE domain order by one step. Returns the resulting status.
 * Idempotent: safe to call repeatedly on the same order — each step checks
 * its preconditions before doing work.
 */
export async function advanceDomainOrder(env: Env, order: Order): Promise<string> {
  const supabase = adminClient(env);

  try {
    switch (order.status) {
      case 'pending': {
        // Step 1: kick off Spaceship registration
        const operationId = await registerDomain(env, order.domain);
        await updateDomainOrder(supabase, order.id, {
          status: 'registering',
          spaceship_op_id: operationId,
        });
        return 'registering';
      }

      case 'registering': {
        // Step 2: poll Spaceship for the registration to complete
        if (!order.spaceship_op_id) {
          throw new Error('registering order has no spaceship_op_id');
        }
        const status = await pollOperation(env, order.spaceship_op_id);
        if (status === 'pending') {
          console.log(`[cron] domain ${order.domain} still registering...`);
          return 'registering';
        }
        if (status === 'failed') {
          throw new Error(`Spaceship registration failed for ${order.domain}`);
        }
        // success
        await updateDomainOrder(supabase, order.id, {
          status: 'registered',
          registered_at: new Date().toISOString(),
        });
        console.log(`Domain registered: ${order.domain}`);
        return 'registered';
      }

      case 'registered': {
        // Step 3: register www + apex on Approximated. Track each side
        // individually so a partial failure doesn't mask the half that worked.
        let apexId: number | null = null;
        let wwwId: number | null = null;
        let apexErr: string | null = null;
        let wwwErr: string | null = null;

        try {
          const wwwResult = await addVirtualHost(env, `www.${order.domain}`);
          wwwId = wwwResult.id;
        } catch (err: any) {
          wwwErr = err.message;
        }
        try {
          const apexResult = await addVirtualHost(env, order.domain);
          apexId = apexResult.id;
        } catch (err: any) {
          apexErr = err.message;
        }

        const errMsgs: string[] = [];
        if (wwwErr) errMsgs.push(`www: ${wwwErr}`);
        if (apexErr) errMsgs.push(`apex: ${apexErr}`);

        await updateDomainOrder(supabase, order.id, {
          status: 'vhosts_added',
          railway_domain_id: String(apexId || wwwId || ''), // legacy column name
          ...(errMsgs.length > 0 ? { error_message: `Partial Approximated setup — ${errMsgs.join('; ')}` } : {}),
        });
        return 'vhosts_added';
      }

      case 'vhosts_added': {
        // Step 4: Spaceship DNS — apex + www A → cluster IP
        await setupDns(env, order.domain);
        await updateDomainOrder(supabase, order.id, {
          status: 'active',
          dns_configured_at: new Date().toISOString(),
        });
        if (order.family_id) {
          await updateFamily(supabase, order.family_id, { custom_domain: order.domain });
        }
        console.log(`Domain fully active on Approximated: ${order.domain}`);
        return 'active';
      }

      default:
        return order.status;
    }
  } catch (err: any) {
    console.error(`[cron] domain order ${order.id} (${order.domain}) failed:`, err.message);
    await updateDomainOrder(supabase, order.id, {
      status: 'failed',
      error_message: err.message,
    });

    // If Spaceship already registered the domain, disable auto-renew so we
    // don't get billed again next year for an orphaned domain. Discovered
    // Apr 26 2026 with legacyodysseytest5/6.com.
    if (order.registered_at && order.domain) {
      try {
        await setAutoRenew(env, order.domain, false);
        console.log(`Disabled Spaceship auto-renew on orphaned ${order.domain}`);
      } catch (renewErr: any) {
        console.error(
          `Failed to disable auto-renew on orphaned ${order.domain}: ${renewErr.message}`
        );
      }
    }
    return 'failed';
  }
}
